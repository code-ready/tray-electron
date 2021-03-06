import React from 'react';
import {
    Button,
    ButtonVariant,
    EmptyState,
    EmptyStateBody,
    EmptyStateSecondaryActions,
    EmptyStatePrimary,
    Spinner,
} from '@patternfly/react-core';

import "./SetupSpinner.scss";


interface SetupSpinnerProps {
    preset: string;
    consentTelemetry: boolean | string;
    pullsecret: string;
    skipDaemonStart: boolean;
    onFinishClicked: () => void;
}

interface SetupSpinnerState {
    notReadyForUse: boolean;
    logs: string[];
}

export class SetupSpinner extends React.Component<SetupSpinnerProps> {

    state: Readonly<SetupSpinnerState>;

    constructor(props: SetupSpinnerProps) {
        super(props)

        this.state = {
            logs: [],
            notReadyForUse: true,
        };
    }

    componentDidMount() {
        // start the crc setup process
        // different configs needed will be passed as args
        window.api.onSetupLogs(async (event, message) => {
            console.log(message);
            this.state.logs.push(message);
        })
        window.api.onSetupEnded(async (event, message) => {
            this.setState({ notReadyForUse: false });
        })
        window.api.startSetup({
            preset: this.props.preset,
            consentTelemetry: this.props.consentTelemetry,
            pullsecret: this.props.pullsecret,
            skipDaemonStart: this.props.skipDaemonStart
        })
        window.api.onSetupError(async (event, message) => {
            const result = await window.api.showModalDialog('Error', message + "\r\n Error: '" + this.state.logs.pop() + "'. Please restart.", 'Close');
            if(result === 'Close') {
                window.api.forceEndErrorDuringSetup();
                window.close();
                //window.api.appQuit();
            }
        });
    }

    componentWillUnmount() {
        window.api.removeSetupLogListeners();
    }

    handleDocsLinks(url: string) {
        window.api.openLinkInDefaultBrowser(url)
    }

    render () {
        return (
            <EmptyState>
                <EmptyStateBody>
                    <div style={{height:"180px",width:"400px",marginTop:"160px"}}>

                        { this.state.notReadyForUse ? <>Running setup ...<br/><br/><Spinner diameter="80px" isSVG /><br/><br/>This may take several minutes.</> : "Setup done."}
                        
                    </div>
                </EmptyStateBody>
                <EmptyStatePrimary>
                    <Button isDisabled={this.state.notReadyForUse} variant={ButtonVariant.primary} onClick={this.props.onFinishClicked}>Start using</Button>
                </EmptyStatePrimary>
                <EmptyStateSecondaryActions>
                    {
                        // TODO: For now, no buttons until content is ready
                        // TODO: This should be externally provided
                        //<Button variant={ButtonVariant.link} onClick={ () => { this.handleDocsLinks("https://crc.dev") }}>Visit Getting started Guide</Button>
                        //<Button variant={ButtonVariant.link} onClick={ () => { this.handleDocsLinks("https://crc.dev") }}>Example Deployments</Button>
                    }
                </EmptyStateSecondaryActions>
            </EmptyState>
        );
    }
}