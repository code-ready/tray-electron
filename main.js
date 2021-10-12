const {app, clipboard, Menu, Tray, BrowserWindow, shell, Notification} = require('electron');
const path = require('path');
const childProcess = require('child_process');
const { dialog } = require('electron')
const os = require('os');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

const DaemonCommander = require('./commander')
const commander = new DaemonCommander()

function crcBinary() {
  if (app.isPackaged) {
    return path.join(app.getAppPath(), 'crc');
  }
  return "crc"
}

let parentWindow = undefined
var isMac = (os.platform() === "darwin")

const start = async function() {
  // launching the daemon
  childProcess.execFile(crcBinary(), ["daemon", "--watchdog"], function(err, data) {
    dialog.showErrorBox(`Backend failure`, `Backend failed to start: ${err}`)
  });

  // polling status
  while(true) {
    var state = await commander.status();
    createTrayMenu(state.CrcStatus);
    await delay(1000);
  }
}

openAbout = function() {
  // open with 'ready-to-show'
  const childWindow = new BrowserWindow(
    {
      show: true,
      backgroundColor: '#ffffff',
      webPreferences: {
	      nodeIntegration: true,
	      contextIsolation: false,
	      nativeWindowOpen: true,
        enableRemoteModule: true 
      }
    });
  childWindow.setMenuBarVisibility(false);
  childWindow.loadURL(`file://${path.join(app.getAppPath(), 'about.html')}`)
}

openSettings = function() {
  // open with 'ready-to-show'
  const childWindow = new BrowserWindow(
    {
      show: true,
      backgroundColor: '#ffffff',
      webPreferences: {
	      nodeIntegration: true,
	      contextIsolation: false,
	      nativeWindowOpen: true,
        enableRemoteModule: true,
      }
    });
  childWindow.setMenuBarVisibility(false);
  childWindow.loadURL(`file://${path.join(app.getAppPath(), 'settings.html')}`)
}

openStatus = function() {
  // open with 'ready-to-show'
  const childWindow = new BrowserWindow(
    {
      show: true,
      backgroundColor: '#ffffff',
      webPreferences: {
	      nodeIntegration: true,
	      contextIsolation: false,
	      nativeWindowOpen: true,
        enableRemoteModule: true,
      }
    });
  childWindow.setMenuBarVisibility(false);
  childWindow.loadURL(`file://${path.join(app.getAppPath(), 'status.html')}`)
}


openWebConsole = async function() {
  var result = await commander.consoleUrl();
  var url = result.ClusterConfig.WebConsoleURL;
  shell.openExternal(url);
}

clipLoginAdminCommand = async function() {
  var result = await commander.consoleUrl();
  var command = "oc.exe login -u kubeadmin -p " + result.ClusterConfig.KubeAdminPass + " " + result.ClusterConfig.ClusterAPI;
  clipboard.writeText(command);
}

clipLoginDeveloperCommand = async function() {
  var result = await commander.consoleUrl();
  var command = "oc.exe login -u developer -p developer " + result.ClusterConfig.ClusterAPI;
  clipboard.writeText(command);
}

mapStateForImage = function(state) {
  state = state.toLowerCase();

  switch(state) {
    case 'running':  // started
    case 'stopped':
    case 'unknown':
      return state;
    case 'starting':
    case 'stopping':
      return 'busy';
    default:
      return 'unknown';
  }
}

createTrayMenu = function(state) {

  if(state == '' || state == undefined) state = `Unknown`;

  const contextMenu = Menu.buildFromTemplate([
    {
      label: state,
      click() { null },
      icon: path.join(app.getAppPath(), 'assets', `status-${mapStateForImage(state)}.png`),
      enabled: false
    },
    { type: 'separator' },
    {
      label: 'Status and logs',
      click() { openStatus(); }
    },
    { type: 'separator' },
    {
      label: 'Start',
      click() { handleStartClick(); }
    },
    {
      label: 'Stop',
      click() { handleStopClick(); }
    },
    {
      label: 'Delete',
      click() { handleDeleteClick(); }
    },
    { type: 'separator' },
    {
      label: 'Launch Web Console',
      click() { openWebConsole(); }
    },
    {
      label: 'Copy OC Login Command',
      submenu: [
        {
          label: 'Admin',
          click() { clipLoginAdminCommand(); }
        },
        {
          label: 'Developer',
          click() { clipLoginDeveloperCommand(); }
        }
      ]
    },
    { type: 'separator' },
    {
      label: 'Settings',
      click() { openSettings(); }
    },
    { type: 'separator' },
    {
      label: 'About',
      click() { openAbout(); }
    },
    {
      label: 'Exit',
      click() { app.quit(); },
      accelerator: 'CommandOrControl+Q'
    }
  ]);

  tray.setContextMenu(contextMenu);
}

const showNotification = function(title, body) {
  new Notification({ title: title, body: body }).show()
}

const handleStartClick = async function() {
    const startResult = await commander.start();
    if (startResult.KubeletStarted) {
      showNotification("Cluster started", "CodeReady Containers cluster successfully started");
    } else {
      showNotification("Failed to start cluster", startResult.error);
    }
}

const handleDeleteClick = async function() {
  const deleteResult = await commander.delete();
  if (deleteResult.deleted) {
    showNotification("Cluster Deleted", "CodeReady Containers cluster successfully deleted");
  } else {
    showNotification("Cluster not deleted", deleteResult.error);
  }
}

const handleStopClick = async function() {
  const stopResult = await commander.stop();
  if (stopResult.stopped) {
    showNotification("Cluster Stopped", "CodeReady Containers cluster stopped")
  } else {
    showNotification("Cluster did not Stop", stopResult.error);
  }
}

app.whenReady().then(() => {
  // parent window to prevent app closing
  parentWindow = new BrowserWindow({ show: false })

  // Setup tray
  tray = new Tray(path.join(app.getAppPath(), 'assets', 'ocp-logo.png'))
  tray.setToolTip('CodeReady Containers');
  createTrayMenu("Unknown");
  tray.on('click', () => {
    tray.popUpContextMenu()
  });
  start();
});

if (isMac) {
  app.dock.hide()
}
