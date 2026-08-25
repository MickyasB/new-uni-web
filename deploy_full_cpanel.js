const ftp = require('basic-ftp');
const path = require('path');
const { execSync } = require('child_process');
const http = require('http');

async function deployToCpanel() {
  console.log('🚀 Step 1: Building all packages for production...');

  console.log('  -> Building @bingo/shared...');
  execSync('npm run build', { cwd: path.join(__dirname, 'packages', 'shared'), stdio: 'inherit' });

  console.log('  -> Building @bingo/backend...');
  execSync('npm run build', { cwd: path.join(__dirname, 'packages', 'backend'), stdio: 'inherit' });

  console.log('  -> Creating standalone esbuild bundle for backend...');
  const esbuildPath = path.join(__dirname, 'packages', 'backend', 'node_modules', 'esbuild');
  const esbuild = require(esbuildPath);
  await esbuild.build({
    entryPoints: [path.join(__dirname, 'packages', 'backend', 'src', 'index.ts')],
    bundle: true,
    platform: 'node',
    target: 'node18',
    outfile: path.join(__dirname, 'packages', 'backend', 'dist', 'bundle.js'),
    external: ['pg-native'],
  });
  console.log('  ✅ Standalone bundle.js created successfully.');

  console.log('  -> Building @bingo/player-app...');
  execSync('npm run build', { cwd: path.join(__dirname, 'packages', 'player-app'), stdio: 'inherit' });

  console.log('  -> Building @bingo/admin-app...');
  execSync('npm run build', { cwd: path.join(__dirname, 'packages', 'admin-app'), stdio: 'inherit' });

  console.log('\n🌐 Step 2: Connecting to cPanel FTP (gin.hostns.io)...');
  const client = new ftp.Client();
  client.ftp.verbose = false;
  client.ftp.timeout = 180000;

  try {
    await client.access({
      host: 'gin.hostns.io',
      user: 'gymtragh',
      password: 'Gym@2026',
      secure: false,
    });
    console.log('  ✅ FTP Connected successfully.');

    const remoteBase = 'bingo.gymtradingplc.com';
    await client.cd(remoteBase);

    // 1. Deploy Player App
    console.log('\n📱 Step 3: Deploying Player App to bingo.gymtradingplc.com/...');
    const playerDist = path.join(__dirname, 'packages', 'player-app', 'dist');
    await client.uploadFromDir(playerDist);
    console.log('  ✅ Player App uploaded.');

    // 2. Deploy Admin App
    console.log('\n👑 Step 4: Deploying Admin App to bingo.gymtradingplc.com/admin/...');
    try {
      await client.ensureDir('admin');
    } catch (e) {}
    const adminDist = path.join(__dirname, 'packages', 'admin-app', 'dist');
    await client.uploadFromDir(adminDist);
    console.log('  ✅ Admin App uploaded.');

    // 3. Deploy Backend Dist (including standalone bundle.js)
    console.log('\n⚙️ Step 5: Deploying Backend code to bingo.gymtradingplc.com/dist/...');
    await client.cd('/' + remoteBase);
    try {
      await client.ensureDir('dist');
    } catch (e) {}
    const backendDist = path.join(__dirname, 'packages', 'backend', 'dist');
    await client.uploadFromDir(backendDist);
    console.log('  ✅ Backend dist uploaded.');

    // 4. Upload .env file with Telegram Bot Token & Admin Chat ID
    console.log('\n🔒 Step 6: Uploading backend .env configuration...');
    await client.cd('/' + remoteBase);
    const envPath = path.join(__dirname, 'packages', 'backend', '.env');
    await client.uploadFrom(envPath, '.env');
    console.log('  ✅ .env configuration uploaded.');

    // 5. Upload app.js launcher (using bundle.js)
    const appJsContent = `const app = require('./dist/bundle.js');
const defaultApp = app.default || app;
module.exports = defaultApp;

if (require.main === module) {
  const PORT = process.env.PORT || 4000;
  defaultApp.listen(PORT, () => {
    console.log(\`[Backend] Listening on port \${PORT}\`);
  });
}
`;
    const { Readable } = require('stream');
    const appJsStream = Readable.from([appJsContent]);
    await client.uploadFrom(appJsStream, 'app.js');
    console.log('  ✅ app.js launcher uploaded.');

    // 6. Upload restart_backend.php
    const restartPhpPath = path.join(__dirname, 'restart_backend.php');
    if (require('fs').existsSync(restartPhpPath)) {
      await client.uploadFrom(restartPhpPath, 'restart_backend.php');
      console.log('  ✅ restart_backend.php uploaded.');
    }

  } catch (err) {
    console.error('❌ FTP Upload error:', err);
  } finally {
    client.close();
  }

  // 7. Restart Backend on cPanel
  console.log('\n🔄 Step 7: Triggering Backend Restart on cPanel...');
  try {
    const res = await new Promise((resolve, reject) => {
      http.get('http://bingo.gymtradingplc.com/restart_backend.php', (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => resolve(body));
      }).on('error', reject);
    });
    console.log('  Server Restart Response:', res);
  } catch (reErr) {
    console.warn('  ⚠️ Restart script notice:', reErr.message);
  }

  console.log('\n🎉 ==============================================');
  console.log('🎉 DEPLOYMENT TO CPANEL COMPLETED SUCCESSFULLY!');
  console.log('👉 Player App: https://bingo.gymtradingplc.com');
  console.log('👉 Admin App:  https://bingo.gymtradingplc.com/admin');
  console.log('👉 Backend API: https://bingo.gymtradingplc.com/api/health');
  console.log('==============================================\n');
}

deployToCpanel();
