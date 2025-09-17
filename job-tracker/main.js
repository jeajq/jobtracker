const { app, BrowserWindow } = require('electron'); //electron entry point
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  /*
  win.loadURL( //use for after react app is built 
    process.env.ELECTRON_START_URL ||
      `file://${path.join(__dirname, 'build', 'index.html')}`
  );*/
  win.loadURL('http://localhost:3000');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
