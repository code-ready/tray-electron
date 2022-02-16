// types for preload-main.js shared contextBridge API

import { State } from "@code-ready/crc-react-components/dist/components/Configuration";
import { CrcState } from "@code-ready/crc-react-components/dist/components/types";
import { IpcRendererEvent } from 'electron';

export interface Versions {
  appVersion?: string;
  crcVersion?: string;
  crcCommit?: string;
  ocpBundleVersion?: string;
  podmanVersion?: string;
}
export interface Configuration {
  Configs: State
}

export interface IpcEventHandler<T> {
  (event: IpcRendererEvent, data: T) : void;
}

export interface LogMessage {
  Messages: string[];
  // Add more?
}

export interface StatusState extends CrcState {
  Preset: string;
}

export interface SetupParams {
  preset: string;
  consentTelemetry: boolean;
  pullsecret: string;
}
export interface DialogOptions {
  message: string;
  title: string;
  buttons: string[];
}

export declare global {
  interface Window {
    api: {
      about: () => Promise<Versions>;
      openLinkInDefaultBrowser: (url: string) => void;
      onConfigurationLoaded: (handler: IpcEventHandler<Configuration>) => void;
      onConfigurationSaved: (handler: IpcEventHandler<{}>) => void;
      configurationLoad: (param: {}) => void;
      configurationSave: (state: State) => void;
      openPullsecretChangeWindow: (param: {}) => void;
      onLogsRetrieved: (handler: IpcEventHandler<LogMessage>) => void;
      retrieveLogs: () => void;
      onStatusChanged: (handler: IpcEventHandler<StatusState>) => void;
      startInstance: (param: {}) => void;
      stopInstance: (param: {}) => void;
      deleteInstance: (param: {}) => void;
      pullsecretChange: (pullSecret: {pullsecret: string} ) => void;

      /**
       * Exist only on "preload-setup.js"
       */
      onSetupLogs: (handler: IpcEventHandler<string>) => void;
      /**
       * Exist only on "preload-setup.js"
       */
      onSetupEnded: (handler: IpcEventHandler<unknown>) => void;
      /**
       * Exist only on "preload-setup.js"
       */
      startSetup: (param: SetupParams) => void;
      /**
       * Exist only on "preload-setup.js"
       */
      closeActiveWindow: () => void;
      /**
       * Exist only on "preload-setup.js"
       */
      removeSetupLogListeners: () => void;
      /**
       * Exist only on "preload-setup.js"
       */
      closeSetupWizard: () => void;

      showModalDialog: (title: string, message: string, ...items: string[]) => Promise<string>;
    },
    dialogApi: {
      getDialogOptions: () => Promise<DialogOptions>;
      buttonClicked: (value: string) => void;
    }
  }
}