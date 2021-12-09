import React from 'react';
import { Wizard,
    Card,
    CardTitle,
    CardBody,
    CardFooter,
    Button,
    ButtonVariant, 
    TextContent,
    TextVariants,
    Text,
    Hint,
    HintBody,
    HelperText,
    HelperTextItem,
    HintTitle,
    DescriptionList,
    DescriptionListDescription,
    DescriptionListGroup,
    DescriptionListTerm,
    Checkbox,
    Title,
    EmptyState,
    EmptyStateBody,
    EmptyStateIcon,
    CodeBlock,
    CodeBlockCode,
    EmptyStateSecondaryActions,
    EmptyStatePrimary,
} from '@patternfly/react-core';
    import InfoIcon from '@patternfly/react-icons/dist/esm/icons/info-icon';

class SetupSpinner extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            setupLogs: "",
        }
        this.handlePrimaryButtonAction = this.handlePrimaryButtonAction.bind(this);
    }

    componentDidMount() {
        // start the crc setup process
        // different configs needed will be passed as args
        console.log("Its mounted");
        window.api.handleSetupLogs(async (event, args) => {
            this.setState((prevState) => {
                return {
                    setupLogs: prevState.setupLogs + args
                }
            })
        })
        window.api.startSetup({
            bundle: this.props.bundle,
            consentTelemetry: this.props.consentTelemetry
        })
    }

    componentWillUnmount() {
        window.api.removeSetupLogListeners();
    }

    handlePrimaryButtonAction() {
        // issue tray start command then close window
        window.api.closeSetupWizard();
    }

    render () {
        const Spinner = () => (
            <span className="pf-c-spinner" role="progressbar" aria-valuetext="Running Setup...">
              <span className="pf-c-spinner__clipper" />
              <span className="pf-c-spinner__lead-ball" />
              <span className="pf-c-spinner__tail-ball" />
            </span>
        )

        return (
            <EmptyState>
                <EmptyStateIcon variant="container" component={Spinner} />
                <Title size="lg" headingLevel="h4">
                    Running Setup
                </Title>
                <EmptyStateBody>
                    <CodeBlock>
                        <CodeBlockCode id="setup-logs">{this.state.setupLogs}</CodeBlockCode>
                    </CodeBlock>
                </EmptyStateBody>
                <EmptyStatePrimary>
                    <Button variant={ButtonVariant.primary} onClick={this.handlePrimaryButtonAction}>Close window and start crc</Button>
                </EmptyStatePrimary>
                <EmptyStateSecondaryActions>
                    <Button variant={ButtonVariant.link} component="a" href="https://crc.dev">Visit Getting started Guide</Button>
                    <Button variant={ButtonVariant.link} component="a" href="https://crc.dev">Example Deployments</Button>
                </EmptyStateSecondaryActions>
            </EmptyState>
        );
    }
}

export default class SetupWindow extends React.Component {
    constructor(props) {
        super(props);

        this.onNext = this.onNext.bind(this);
        this.closeWizard = this.closeWizard.bind(this);
        this.handleBundleOpenshift = this.handleBundleOpenshift.bind(this);
        this.handleBundlePodman = this.handleBundlePodman.bind(this);
        this.handleTelemetryConsent = this.handleTelemetryConsent.bind(this);

        this.state = {
            stepIdReached: 1,
            bundle: "openshift",
            consentTelemetry: false
        };

    }

    onNext({ id }) {
      this.setState({
        stepIdReached: this.state.stepIdReached < id ? id : this.state.stepIdReached
      });
    }

    closeWizard() {
        window.api.closeActiveWindow();
    }

    handleBundlePodman() {
        this.setState(() => {
                return {bundle: "podman"};
            }
        );
        console.log(this.state.bundle);
    }

    handleBundleOpenshift() {
        this.setState(() => {
                return {bundle: "openshift"};
            }
        );
        console.log(this.state.bundle);
    }

    handleTelemetryConsent() {
        this.setState((prevState) => {
            return {consentTelemetry: !prevState.consentTelemetry};
        });
    }

    render() {
        const { stepIdReached } = this.state;
        const ocpDesc = "This option will run a full cluster environment as a single node. This option will provide a registry, telemetry and access to Operator Hub";
        const podmanDesc = "This options will allow you to use podman to run containers inside a VM environment. It will expose the podman command";

        const steps = [
            { 
                id: 1, 
                name: 'Welcome', 
                component: <Welcome/>, 
            },
            { 
                id: 2, 
                name: 'Choose your environment', 
                component: <ChoosePreset 
                                handleBundleOpenshift={this.handleBundleOpenshift} 
                                handleBundlePodman={this.handleBundlePodman} 
                                ocpDesc={ocpDesc} 
                                podmanDesc={podmanDesc} 
                                currentBundle={this.state.bundle}
                            />, 
                canJumpTo: stepIdReached >= 2, 
            },
            { 
                id: 3, 
                name: 'Review selection', 
                component: <Summary 
                                bundle={this.state.bundle} 
                                handleTelemetryConsent={this.handleTelemetryConsent} 
                                checked={this.state.consentTelemetry}
                            />, 
                canJumpTo: stepIdReached >= 3,
                nextButtonText: "Run Setup",
            },
            {
                id: 4,
                name: "Run Setup",
                isFinishedStep: true,
                component: <SetupSpinner bundle={this.state.bundle} consentTelemetry={this.state.consentTelemetry} />,
            }
        ];
        const title = 'CodeReady Containers setup wizard';
        const description = 'Guided setup wizard for configuring your operating system and host to run CodeReady Containers';
        return (
            <Wizard
                title={title}
                description={description}
                hideClose
                navAriaLabel={`${title} steps`}
                mainAriaLabel={`${title} content`}
                onClose={this.closeWizard}
                steps={steps}
                onNext={this.onNext}
                height={700}
            />
        );
    }
}

const Welcome = () => {
    return (
        <Card isLarge isRounded isFullHeight isHoverable isPlain>
            <CardTitle>Hello</CardTitle>
            <CardBody>In the next few steps we'll ask you a few questions to setup your environment</CardBody>
            <CardFooter>Please click Next to proceed</CardFooter>
      </Card>
    );
}

const ChoosePreset = (props) => {
    return(
        <Card isLarge isRounded isFullHeight isHoverable isPlain>
            <CardTitle>Please Select the bundle you want to use</CardTitle>
            <CardBody>
                <Preset handleClick={props.handleBundleOpenshift} presetName="OpenShift" presetDesc={props.ocpDesc}/>
                <Preset handleClick={props.handleBundlePodman} presetName="Podman" presetDesc={props.podmanDesc}/>
            </CardBody>
            <CardFooter>
                <Hint>
                    <HintTitle>
                        <HelperText>
                            <HelperTextItem icon={<InfoIcon />}>Currently selected bundle is: {props.currentBundle}</HelperTextItem>
                        </HelperText>
                    </HintTitle>
                    <HintBody>
                        These settings can later be changed in the settings dialog
                    </HintBody>
                </Hint>
            </CardFooter>
        </Card>
    );
}

const Preset = (props) => {
    return (
        <>
            <Button variant={ButtonVariant.primary} isLarge onClick={props.handleClick}>
                {props.presetName}
            </Button>
            <TextContent>
                <Text component={TextVariants.p}>
                    {props.presetDesc}
                </Text>
            </TextContent>
        </>
    );
}

const Summary = (props) => {
    const telemetryDesc = "CodeReady Containers is constantly improving and we would like to know more about usage" +
        "Your preference can be changed manually if desired from the settings dialog.";

    return (
        <Card isLarge isRounded isFullHeight isHoverable isPlain>
            <CardTitle>Thank you. You have made the following selection</CardTitle>
            <CardBody isFilled>
                <DescriptionList isHorizontal>
                    <DescriptionListGroup>
                        <DescriptionListTerm>Bundle</DescriptionListTerm>
                        <DescriptionListDescription>{props.bundle}</DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListTerm>
                        <Checkbox 
                            id="check-consent-telemetry" 
                            label="Allow to send telemetry data to Red Hat" 
                            aria-label="Allow to send telemetry data to Red Hat" 
                            description={telemetryDesc || props.checked}
                            onChange={props.handleTelemetryConsent}
                            isChecked={props.checked}
                        />
                    </DescriptionListTerm> 
                </DescriptionList>
            </CardBody>
            <CardFooter>
                <Hint>
                    <HintBody>
                    <HelperText>
                            <HelperTextItem icon={<InfoIcon />}>You can go back and change your selection</HelperTextItem>
                        </HelperText>
                    </HintBody>
                </Hint>
            </CardFooter>
        </Card>
    )
}
