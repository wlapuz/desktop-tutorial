// front.js

import { parseClaimInfo } from './parser.js';
import { ClaimAnalyzer } from './analyzer.js';
import { initializeProductivity } from './productivity.js';


class ClaimManagementTool {
    constructor() {
        this.elements = {
            xInput: document.getElementById('xInput'),
            xResult: document.getElementById('xResult'),
            overlay: document.getElementById('clickToPasteOverlay'),
            xAnalysis: document.getElementById('xAnalysis'),
            xInsight: document.getElementById('xInsight'),
            xD: document.getElementById('xD'),
            xDO: document.getElementById('xDO'),
            xOutput: document.getElementById('xOutput'),
            clearBtns: document.querySelectorAll('.clear-btn'),
            copyBtn: document.querySelector('.copy-btn'),
            logClaimBtn: document.getElementById('log-claim-btn'),
            allLogsBtn: document.getElementById('all-logs-btn'),
            logsPopup: document.getElementById('logs-popup'),
            closePopupBtn: document.querySelector('.close-popup'),
            customizeShortcutsBtn: document.getElementById('customizeShortcuts'),
            pasteButton: document.getElementById('pasteButton'),
            fillButton: document.getElementById('fillButton'),
            fill2Button: document.getElementById('fill2Button'),
            inputTitle: document.querySelector('.box .title-bar .title'),
        };

        this.state = {
            fields: {},
            hasCCS: false,
            hasCA: false,
            isRawInputVisible: false
        };

        this.renderResultBox();
        this.analyzer = new ClaimAnalyzer();
        this.setupEventListeners();
        this.setupClickToPaste();

        this.analyzer = new ClaimAnalyzer();
        this.analysisAnswers = {};
        this.currentScenario = null;

        // Add new elements //Analysis
        this.elements.analysisContainer = document.createElement('div');
        this.elements.analysisContainer.className = 'analysis-container';
        this.elements.xAnalysis.parentNode.insertBefore(this.elements.analysisContainer, this.elements.xAnalysis);

            // Add new element references
            this.elements.selectAllContainer = document.getElementById('selectAllContainer');
            this.elements.selectAll = document.getElementById('selectAll');
            this.elements.selectAllActions = document.getElementById('selectAllActions');
            this.elements.selectNotNeeded = document.getElementById('selectNotNeeded');
            this.elements.selectMoreInfo = document.getElementById('selectMoreInfo');
            this.elements.selectBack = document.getElementById('selectBack');
    
            // Set up event listeners for the new buttons
            this.elements.selectAll.addEventListener('click', () => this.showSelectAllOptions());
            this.elements.selectNotNeeded.addEventListener('click', () => this.selectAllAction('notNeeded'));
            this.elements.selectMoreInfo.addEventListener('click', () => this.selectAllAction('moreInfo'));
            this.elements.selectBack.addEventListener('click', () => this.hideSelectAllOptions());
        //End of Analysis

        this.prewrittenTexts = {
            CV: `Step 3: Decision\nClaim is Valid\nPreliminary Reasonable Investigation Completed:
After thorough examination of the available evidence and indicators, we have found no sufficient basis or grounds to deny or invalidate the customer's assertion at this time. The claim appears to be consistent with our findings, and we will proceed with standard claim processing procedures.\n`,
            CI: `Step 3: Decision\nClaim is Invalid\nComprehensive Investigation Conclusion:
Based on extensive research and analysis, we have identified multiple significant inconsistencies that contradict the customer's assertion. These key indicators substantially undermine the validity of the claim. As a result, we have determined that the claim is invalid, and Provisional Credit (PC) is not due for this transaction.\n`,
            MI: `Step 3: Decision\nInvestigation Status: Additional Information Required
Current findings are inconclusive due to insufficient data. Key details are missing, preventing a determination on the claim's validity. Additional documentation from the customer is necessary to proceed. Provisional Credit (PC) decision is pending further information.\n\nStep 4: Claim Resolution Action\nRework financials to Pend\n\nStep 5: Next steps\nWill keep the claim pending\nLetter sent - More info`,
            CC: "Step 5: Next steps\nClosing Claim",
            FI: "Step 5: Next steps (If applicable)\nClaim will be Finalized on or before FRD.",
            RE: "Step 4: Claim Resolution Action\nRework financials\n",
            AP: "Step 4: Claim Resolution Action\nApproving financial action requested\n"
        };


        // Add the refresh button to your elements
        this.elements.refreshOutputBtn = document.getElementById('refreshOutput');

        // Set up the event listener for the refresh button
        this.elements.refreshOutputBtn.addEventListener('click', this.refreshOutput.bind(this));
        this.currentStep = 3;
        this.setupBigSteppers();
         // Add event listeners for real-time updates
        this.elements.xResult.addEventListener('input', this.updateOutput.bind(this));
        this.elements.xAnalysis.addEventListener('input', this.updateOutput.bind(this));
        this.elements.xD.addEventListener('input', this.updateOutput.bind(this));

        // Add event listeners for special fields
        this.elements.xResult.addEventListener('click', this.handleSpecialFieldClick.bind(this));
        
        // Add event listener for analysis fields
        this.elements.analysisContainer.addEventListener('input', this.updateOutput.bind(this));
    }
    
    updateOutputSection(sectionId, content) {
        const section = document.getElementById(sectionId);
        if (section) {
          section.innerHTML = content;  // Use innerHTML instead of textContent
        }
    }

    setupEventListeners() {
        this.elements.xInput.addEventListener('input', this.debounce(this.handleInput.bind(this), 300));
        this.elements.xD.addEventListener('input', this.debounce(this.updateOutput.bind(this), 300));
        this.elements.xDO.addEventListener('input', this.debounce(this.updateOutput.bind(this), 300));
        this.elements.clearBtns.forEach(btn => btn.addEventListener('click', this.handleClear.bind(this)));
        this.elements.copyBtn.addEventListener('click', this.handleCopy.bind(this));
        this.elements.logClaimBtn.addEventListener('click', this.handleLogClaim.bind(this));
        this.elements.allLogsBtn.addEventListener('click', () => this.elements.logsPopup.style.display = 'block');
        this.elements.closePopupBtn.addEventListener('click', () => this.elements.logsPopup.style.display = 'none');
        this.elements.customizeShortcutsBtn.addEventListener('click', this.handleCustomizeShortcuts.bind(this));
        this.elements.fillButton.addEventListener('click', this.fill.bind(this));
        this.elements.fill2Button.addEventListener('click', this.fill2.bind(this));
        this.elements.xResult.addEventListener('click', this.handleResultClick.bind(this));
    }

    setupClickToPaste() {
        if (this.elements.overlay) {
            this.elements.overlay.addEventListener('click', async () => {
                try {
                    const text = await navigator.clipboard.readText();
                    if (this.elements.xInput) {
                        this.elements.xInput.value = text;
                        this.handleInput({ target: { value: text } });
                    }
                } catch (err) {
                    console.error('Failed to read clipboard contents: ', err);
                }
            });
        }
    }

    handleInput(e) {
        const inputText = e.target.value;
        console.log("Input text length:", inputText.length);
        const parsedClaim = parseClaimInfo(inputText);
        console.log("Parsed claim:", parsedClaim);
        this.updateResultBox(parsedClaim);
        this.currentScenario = parsedClaim.scenario;
        this.renderAnalysisFields(this.currentScenario);
        this.updateAnalysis(parsedClaim);
        this.updateOverlayText(inputText); 
    
        // Show Select All button when a scenario is found
        if (this.currentScenario) {
            this.elements.selectAllContainer.style.display = 'block';
        } else {
            this.elements.selectAllContainer.style.display = 'none';
        }
    
        // Update the status of all fields
        Object.entries(parsedClaim).forEach(([fieldName, value]) => {
            const field = this.state.fields[fieldName];
            if (field && field.container) {
                this.updateFieldStatus(field.container, fieldName, value);
            }
        });
    }

    updateOverlayText(inputText) {
        this.state.hasCCS = inputText.includes('Claim Display');
        this.state.hasCA = inputText.includes('Checking Account Summary');
        
        if (this.elements.overlay) {
            if (this.state.hasCCS && this.state.hasCA) {
                this.elements.overlay.style.display = 'none';
                if (this.elements.xResult) {
                    this.elements.xResult.style.display = 'block';
                }
            } else {
                this.elements.overlay.style.display = 'flex';
                if (this.elements.xResult) {
                    this.elements.xResult.style.display = 'none';
                }
                this.elements.overlay.textContent = this.state.hasCCS ? 'CCS Data Detected - Click to Paste CA' :
                                                    this.state.hasCA ? 'CA Data Detected - Click to Paste CCS' :
                                                    'Click to Paste CCS and CA';
            }
        }
    }

    updateResultBox(parsedClaim) {
        Object.entries(parsedClaim).forEach(([fieldName, value]) => {
            const field = this.state.fields[fieldName];
            if (!field) return;
    
            if (field.value) {
                field.value.value = value || '';
                this.updateFieldStatus(field.container, fieldName, value);
            } else if (field.details) {
                this.updateSpecialField(field, value);
            }
        });
    }

    updateFieldStatus(container, fieldName, value) {
        console.log(`Updating field status: ${fieldName}, value: ${value}`);
    
        if (!(container instanceof Element)) {
            console.error(`Invalid container for ${fieldName}:`, container);
            return;
        }
    
        // Remove all status classes
        container.classList.remove('green', 'red', 'warning', 'has-value', 'not-needed', 'more-info');
    
        // Ensure the container has the correct base classes
        container.classList.add('field-container');
        if (!container.classList.contains('special-field')) {
            container.classList.add('regular-field');
        }
    
        const setColor = (color) => {
            container.classList.add(color);
            console.log(`Set ${color} class for ${fieldName}`);
        }
    
        const isEmpty = (val) => !val || val.trim() === '';
    
        if (this.elements.xInput.value.length < 50) {
            setColor('red');
            console.log(`Short input: Added red class to ${fieldName}`);
            return;
        }
    
        if (!isEmpty(value)) {
            container.classList.add('has-value');
        }
    
        // Handle both special and regular fields
        if (container.classList.contains('special-field')) {
            this.handleSpecialFieldStatus(container, fieldName, value);
        } else {
            // Logic for regular fields
            switch (fieldName) {
                case 'openDate':
                    if (isEmpty(value)) {
                        setColor('red');
                    } else {
                        const oneYearAgo = new Date();
                        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
                        setColor(new Date(value) > oneYearAgo ? 'warning' : 'green');
                    }
                    break;
    
                case 'ytdAvgBal':
                    if (isEmpty(value)) {
                        setColor('red');
                    } else {
                        const claimAmountField = this.state.fields['claimAmount'];
                        const claimAmount = claimAmountField ? parseFloat(claimAmountField.value.value.replace(/[^0-9.-]+/g, "")) : 0;
                        const ytdAvgBal = parseFloat(value.replace(/[^0-9.-]+/g, ""));
                        setColor(ytdAvgBal < claimAmount ? 'warning' : 'green');
                    }
                    break;
    
                case 'disputeCategory':
                case 'sixtyDayLiability':
                case 'moreThanTwoYears':
                    setColor(isEmpty(value) ? 'red' : value === 'Yes' ? 'warning' : 'green');
                    break;
    
                case 'nsf':
                    if (isEmpty(value)) {
                        setColor('red');
                    } else {
                        const nsfValue = parseInt(value, 10);
                        setColor(nsfValue > 9 ? 'warning' : 'green');
                    }
                    break;
    
                default:
                    if (isEmpty(value)) {
                        setColor('red');
                    } else {
                        setColor(this.checkWarningCondition(fieldName, value) ? 'warning' : 'green');
                    }
                    break;
            }
        }
    }

    handleSpecialFieldStatus(container, fieldName, value) {
        const input = container.querySelector('.details-input');
        if (fieldName === 'withdrew') {
            if (value === 'No') {
                container.classList.add('green');
                container.classList.remove('red');
            } else if (value === '6Day' || value === 'Immediate') {
                container.classList.add(input.value.trim() !== '' ? 'green' : 'red');
                container.classList.remove(input.value.trim() !== '' ? 'red' : 'green');
            } else {
                container.classList.add('red');
                container.classList.remove('green');
            }
        } else if (fieldName === 'merchantCredit') {
            container.classList.add(value === 'No' || ((value === 'Partial' || value === 'Full') && input.value.trim() !== '') ? 'green' : 'red');
        }
    }

    handleSpecialFieldClick(fieldName, action) {
        const field = this.state.fields[fieldName];
        if (!field || !field.container) return;
    
        const container = field.container;
        const elements = {
            buttonsContainer: container.querySelector('.buttons-container'),
            secondaryButtons: container.querySelector('.secondary-buttons'),
            detailsInput: container.querySelector('.details-input'),
            actionButton: container.querySelector(`.${action}-btn`)
        };
    
        container.querySelectorAll('button').forEach(btn => btn.classList.remove('selected'));
        elements.actionButton.classList.add('selected');
    
        if (fieldName === 'withdrew' || fieldName === 'merchantCredit') {
            if (action === 'yes') {
                elements.buttonsContainer.style.display = 'none';
                elements.secondaryButtons.style.display = 'flex';
                container.classList.add('red');
                container.classList.remove('green');
            } else if (action === 'no') {
                this.resetSpecialField(fieldName);
                container.classList.add('green');
                container.classList.remove('red');
            } else { // '6Day', 'Immediate', 'Partial', or 'Full'
                elements.detailsInput.style.display = 'block';
                this.updateSpecialFieldStatus(container, elements.detailsInput);
            }
        } else {
            // Existing logic for other fields
            if (action === 'yes') {
                elements.buttonsContainer.style.display = 'none';
                elements.secondaryButtons.style.display = 'flex';
            } else if (action === 'no') {
                this.resetSpecialField(fieldName);
                container.classList.add('green');
            } else {
                elements.detailsInput.style.display = 'block';
                this.updateSpecialFieldStatus(container, elements.detailsInput);
            }
        }
        this.updateSpecialFieldStatus(container, elements.detailsInput);
        this.updateOutput(); // Add this line to update the output
    }

    updateSpecialFieldStatus(container, detailsInput) {
        if (detailsInput && detailsInput.style.display !== 'none') {
            if (detailsInput.value.trim() === '') {
                container.classList.add('red');
                container.classList.remove('green');
            } else {
                container.classList.add('green');
                container.classList.remove('red');
            }
        }
    }

    resetSpecialField(fieldName) {
        const field = this.state.fields[fieldName];
        if (!field || !field.container) return;

        const container = field.container;
        const buttonsContainer = container.querySelector('.buttons-container');
        const secondaryButtons = container.querySelector('.secondary-buttons');
        const detailsInput = container.querySelector('.details-input');

        container.classList.remove('green', 'red');
        if (buttonsContainer) buttonsContainer.style.display = 'flex';
        if (secondaryButtons) secondaryButtons.style.display = 'none';
        if (detailsInput) {
            detailsInput.style.display = 'none';
            detailsInput.value = '';
        }

        // Reset all buttons
        container.querySelectorAll('button').forEach(btn => btn.classList.remove('selected'));
    }

    handleResetSpecialField(fieldName) {
        this.resetSpecialField(fieldName);
        const field = this.state.fields[fieldName];
        if (field && field.container) {
            field.container.classList.remove('green', 'red');
        }
    }

    checkWarningCondition(fieldName, value) {
        const currentDate = new Date();
        switch (fieldName) {
            case 'customerSince':
                return new Date(value) > new Date(currentDate.setFullYear(currentDate.getFullYear() - 1));
            case 'dateOfBirth':
                const age = this.calculateAge(value);
                return age > 60 || (age > 10 && age < 18);
            default:
                return false;
        }
    }

    calculateAge(dateString) {
        const today = new Date();
        const birthDate = new Date(dateString);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }

    handleResultClick(e) {
        const field = e.target.closest('.field-container');
        if (!field) return;

        const fieldName = field.dataset.field;
        const action = e.target.classList.contains('yes-btn') ? 'yes' :
                       e.target.classList.contains('no-btn') ? 'no' :
                       e.target.classList.contains('option1-btn') ? 'option1' :
                       e.target.classList.contains('option2-btn') ? 'option2' : null;

        if (action) {
            this.handleSpecialFieldClick(fieldName, action);
        }
    }

    updateTitle(title) {
        if (this.elements.inputTitle) {
            this.elements.inputTitle.textContent = title;
        }
    }

    renderResultBox() {
        const regularFields = [
            { name: 'scenario', label: 'Scenario' },
            { name: 'status', label: 'Claim Status' },
            { name: 'claimAmount', label: 'Claim Amount' },
            { name: 'disputeCategory', label: 'Dispute Ctgry' },
            { name: 'sixtyDayLiability', label: '60 D Liability' },
            { name: 'moreThanTwoYears', label: 'Tx > 2 Years' },
            { name: 'customerSince', label: 'Cx Since' },
            { name: 'dateOfBirth', label: 'Date of Birth' },
            { name: 'openDate', label: 'Open Date' },
            { name: 'ytdAvgBal', label: 'YTD Avg Bal' },
            { name: 'nsf', label: 'NSF' }
        ];
    
        const specialFields = [
            { name: 'withdrew', label: 'Withdrew' },
            { name: 'merchantCredit', label: 'Mrct Credit' },
            { name: 'claimsFiledLess1yr', label: 'Filed less than 1yr' },
            { name: 'immediateUseOfFunds', label: 'Funds Used Immediately' },
            { name: 'pcUsedToFundOtherClaims', label: 'PC Used for Other Claims' },
            { name: 'unusualDepositPriorToReporting', label: 'Unusual deposit' }
        ];
    
        if (this.elements.xResult) {
            // Clear existing content
            this.elements.xResult.innerHTML = '';
    
            // Create the main container for all fields
            const fieldsContainer = document.createElement('div');
            fieldsContainer.className = 'fields-container';
            this.elements.xResult.appendChild(fieldsContainer);
    
            // Create and append the Account Number field
            const accountNumberField = this.createFieldElement({ name: 'accountNumber', label: 'Account Number' });
            accountNumberField.classList.add('account-number-field');
            fieldsContainer.appendChild(accountNumberField);
    
            // Create and append the regular fields container
            const regularFieldsContainer = document.createElement('div');
            regularFieldsContainer.className = 'regular-fields';
            fieldsContainer.appendChild(regularFieldsContainer);
    
            // Create and append the special fields container
            const specialFieldsContainer = document.createElement('div');
            specialFieldsContainer.className = 'special-fields';
            this.elements.xResult.appendChild(specialFieldsContainer);
    
            // Populate regular fields
            regularFields.forEach(field => {
                const fieldElement = this.createFieldElement(field);
                regularFieldsContainer.appendChild(fieldElement);
            });
    
            // Populate special fields
            specialFields.forEach(field => {
                let fieldElement;
                if (field.name === 'withdrew' || field.name === 'merchantCredit') {
                    fieldElement = this.createSpecialFieldElement(field);
                } else {
                    fieldElement = this.createFieldElement(field);
                }
                specialFieldsContainer.appendChild(fieldElement);
            });
        }
    }

    createFieldElement(field) {
        const container = document.createElement('div');
        container.className = 'field-container regular-field';
        container.dataset.field = field.name;
    
        const label = document.createElement('span');
        label.className = 'field-label';
        label.textContent = `${field.label}:`;
    
        const focusControl = document.createElement('input');
        focusControl.type = 'checkbox';
        focusControl.className = 'field-focus-control';
    
        const value = document.createElement('textarea');
        value.className = 'field-value';
        value.id = `field-${field.name}`;
        value.maxLength = 12; // Set 12 character limit
    
        // Prevent default Enter behavior and trigger blur
        value.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                value.blur();
            }
        });
    
        // Add input event listener to update status on content change
        value.addEventListener('input', () => {
            this.updateFieldStatus(container, field.name, value.value);
        });
    
        // Add blur event listener to handle end of input modification
        value.addEventListener('blur', () => {
            focusControl.checked = false;
            // You can add any additional logic here for when input modification ends
            console.log(`Input modification ended for ${field.name}`);
        });
    
        container.appendChild(label);
        container.appendChild(focusControl);
        container.appendChild(value);
    
        // Add click event listener to the container
        container.addEventListener('click', (e) => {
            if (e.target !== value) {
                focusControl.checked = true;
                value.focus();
            }
        });
    
        this.state.fields[field.name] = { container, value };
    
        return container;
    }

    createSpecialFieldElement(field) {
        const container = document.createElement('div');
        container.className = 'field-container special-field';
        container.dataset.field = field.name;
    
        const labelContainer = document.createElement('div');
        labelContainer.className = 'label-container';
    
        const label = document.createElement('span');
        label.className = 'field-label';
        label.textContent = `${field.label}:`;
    
        const resetBtn = document.createElement('button');
        resetBtn.className = 'reset-btn';
        resetBtn.textContent = 'Reset';
        resetBtn.addEventListener('click', () => this.handleResetSpecialField(field.name));
    
        labelContainer.appendChild(label);
        labelContainer.appendChild(resetBtn);
    
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'buttons-container';
    
        const secondaryButtons = document.createElement('div');
        secondaryButtons.className = 'secondary-buttons';
    
        const buttonData = [
            { class: 'yes-btn', text: 'Yes', container: buttonsContainer },
            { class: 'no-btn', text: 'No', container: buttonsContainer },
            { class: 'option1-btn', text: field.name === 'withdrew' ? '6Day' : 'Partial', container: secondaryButtons },
            { class: 'option2-btn', text: field.name === 'withdrew' ? 'Immediate' : 'Full', container: secondaryButtons }
        ];
    
        buttonData.forEach(data => {
            const button = document.createElement('button');
            button.className = data.class;
            button.textContent = data.text;
            data.container.appendChild(button);
        });
    
        const detailsInput = document.createElement('input');
        detailsInput.type = 'text';
        detailsInput.className = 'details-input';
        detailsInput.placeholder = 'Enter details...';
    
        detailsInput.addEventListener('input', () => this.handleSpecialFieldInput(field.name));
    
        container.appendChild(labelContainer);
        container.appendChild(buttonsContainer);
        container.appendChild(secondaryButtons);
        container.appendChild(detailsInput);
    
        this.state.fields[field.name] = { container, detailsInput };
    
        return container;
    }

    handleSpecialFieldInput(fieldName) {
        const field = this.state.fields[fieldName];
        if (!field || !field.container) return;

        const container = field.container;
        const detailsInput = container.querySelector('.details-input');
        this.updateSpecialFieldStatus(container, detailsInput);
    }

    fill() {
        const sampleText = `	 Queues 	 Claim 	 Financials 	 Approvals 	 Reconstruction 	 Enhanced Claim Search 	 Retail Digital Intake 
	Claim Search	Click to Minimize	

Claim Number
123456789123456
Search Results, Total Claims Found: 1
123456789123456
D
09/09/2024 11:03 AM
Closed
$119.95

Birth Date:	02/16/2005 	Segment:	 
SSN/TIN:	XX  Copy 	Customer Since:	06/11/2024 
 	 	Status:	03 
	Claim Display  Segment: No Special Segment, LOB Tier1: National Ret
Reference Number: 123456789123456	
Refresh	Show Available Actions	Edit
Customer Name:	D	Claim Amount:	$119.95
SSN:	XX  Copy	Status Code:	Closed (08)
Transactions:
Date	Code	Scenario	Description	Amount	Account
07/09/2024	0543 Show Additional Information	Account Take Over	E 7 07/09	$119.95	XXXXX2581  Copy Total Checking
XXXXXXXXXXXX3302  Copy ATM/Debit Card`;

        this.appendToInput(sampleText);
    }

    fill2() {
        const sampleText2 = `

Checking Account Summary

$0.00
Average Balance YTD

$1,188.00	
Accrued 

No Assigned Overdraft Officer
Total # Occurrences MTD

1	
Total # OD/NSF Occurrences Past 12 Months

61 (days debits presented against NSF funds)

Account

Miscellaneous

Open Date

04/10/2023	
Close Date


No
HelpLE`;

        this.appendToInput(sampleText2);
    }

    renderAnalysisFields(scenario) {
        this.elements.analysisContainer.innerHTML = '';
        const questions = this.analyzer.getQuestionsForScenario(scenario);
        const isFraud = this.analyzer.isFraudScenario(scenario);

        if (isFraud) {
            this.elements.analysisContainer.style.gridTemplateColumns = '1fr';
        } else {
            this.elements.analysisContainer.style.gridTemplateColumns = '1fr 1fr';
        }

        questions.forEach((q, index) => {
            const fieldContainer = this.createFieldContainer(q, index, isFraud);
            this.elements.analysisContainer.appendChild(fieldContainer);
        });

        this.updateAnalysisOutput();
    }

    createFieldContainer(question, index, isFraud) {
        const fieldContainer = document.createElement('div');
        fieldContainer.className = 'analysis-field-container';
        fieldContainer.dataset.questionIndex = index;

        const questionText = document.createElement('span');
        questionText.className = 'question-text';
        questionText.textContent = question.question;

        if (isFraud) {
            const greenContainer = this.createFraudFlagContainer('green', question.green);
            const redContainer = this.createFraudFlagContainer('red', question.red);
            
            const fraudInput = document.createElement('input');
            fraudInput.type = 'text';
            fraudInput.className = 'fraud-input';
            fraudInput.style.display = 'none';
            fraudInput.addEventListener('input', () => this.updateAnalysisOutput());

            fieldContainer.appendChild(questionText);
            fieldContainer.appendChild(greenContainer);
            fieldContainer.appendChild(redContainer);
            fieldContainer.appendChild(fraudInput);

            // Set initial state to placeholder (gray with green content)
            fieldContainer.classList.add('f', 'placeholder');
            greenContainer.style.display = 'block';
            redContainer.style.display = 'none';

            fieldContainer.addEventListener('click', (e) => {
                if (e.target !== fraudInput) {
                    this.handleFraudFieldClick(e, index);
                }
            });
            fieldContainer.addEventListener('contextmenu', (e) => {
                if (e.target !== fraudInput) {
                    this.handleFraudFieldRightClick(e, index);
                    e.preventDefault();
                }
            });
        } else {
            const answerInput = document.createElement('input');
            answerInput.type = 'text';
            answerInput.className = 'answer-input';
            answerInput.value = this.analysisAnswers[index]?.answer || '';
            answerInput.addEventListener('input', (e) => this.handleAnswerInput(e, index));

            fieldContainer.appendChild(questionText);
            fieldContainer.appendChild(answerInput);

            fieldContainer.addEventListener('click', (e) => this.handleNonFraudFieldClick(e, index));
            fieldContainer.addEventListener('contextmenu', (e) => this.handleNonFraudFieldRightClick(e, index));
        }

        fieldContainer.addEventListener('dblclick', (e) => this.handleFieldDoubleClick(e, index));

        return fieldContainer;
    }

    createFraudFlagContainer(type, text) {
        const container = document.createElement('div');
        container.className = `fraud-flag-container f ${type}`;
        container.style.display = 'none';

        const textElement = document.createElement('span');
        textElement.textContent = text;
        container.appendChild(textElement);

        return container;
    }

    handleNonFraudFieldClick(event, index) {
        event.preventDefault();
        const container = event.currentTarget;
        if (container.classList.contains('more-info')) {
            this.resetMoreInfoState(container, index);
        }
    }

    handleNonFraudFieldRightClick(event, index) {
        event.preventDefault();
        const container = event.currentTarget;
        if (container.classList.contains('more-info')) {
            this.resetMoreInfoState(container, index);
        } else {
            container.classList.add('more-info');
            container.querySelector('.answer-input').style.display = 'none';
            this.analysisAnswers[index] = { answer: '', state: 'moreInfo' };
            this.updateAnalysisFieldStatus(container, index);
            this.updateAnalysisOutput();
        }
    }

    resetMoreInfoState(container, index) {
        container.classList.remove('more-info');
        const answerInput = container.querySelector('.answer-input');
        answerInput.style.display = 'block';
        answerInput.value = '';
        this.analysisAnswers[index] = { answer: '', state: 'unanswered' };
        this.updateAnalysisFieldStatus(container, index);
        this.updateAnalysisOutput();
    }

    createFraudFieldContainer(type, text) {
        const container = document.createElement('div');
        container.className = `fraud-field-container f ${type}`;
        container.style.display = 'none';

        const textElement = document.createElement('span');
        textElement.textContent = text;

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'fraud-input';

        container.appendChild(textElement);
        container.appendChild(input);

        return container;
    }

    handleFraudFieldClick(event, index) {
        event.preventDefault();
        const container = event.currentTarget;
        if (container.classList.contains('not-needed')) {
            return;
        }

        const greenContainer = container.querySelector('.f.green');
        const redContainer = container.querySelector('.f.red');
        const fraudInput = container.querySelector('.fraud-input');

        container.classList.remove('placeholder', 'f', 'red');
        container.classList.add('f', 'green');
        greenContainer.style.display = 'block';
        redContainer.style.display = 'none';
        fraudInput.style.display = 'block';
        this.analysisAnswers[index] = { answer: 'GREEN', state: 'answered' };

        this.updateAnalysisFieldStatus(container, index);
        this.updateAnalysisOutput();
    }

    handleFraudFieldRightClick(event, index) {
        event.preventDefault();
        const container = event.currentTarget;
        if (container.classList.contains('not-needed')) {
            return;
        }

        const greenContainer = container.querySelector('.f.green');
        const redContainer = container.querySelector('.f.red');
        const fraudInput = container.querySelector('.fraud-input');

        container.classList.remove('placeholder', 'f', 'green');
        container.classList.add('f', 'red');
        greenContainer.style.display = 'none';
        redContainer.style.display = 'block';
        fraudInput.style.display = 'block';
        this.analysisAnswers[index] = { answer: 'RED', state: 'answered' };

        this.updateAnalysisFieldStatus(container, index);
        this.updateAnalysisOutput();
    }

    handleAnswerInput(event, index) {
        const answer = event.target.value;
        this.analysisAnswers[index] = {
            ...this.analysisAnswers[index],
            answer: answer,
            state: answer ? 'answered' : 'unanswered'
        };
        this.updateAnalysisFieldStatus(event.target.closest('.analysis-field-container'), index);
        this.updateAnalysisOutput();
    }

    handleFieldClick(event, index) {
        const container = event.currentTarget;
        const answerInput = container.querySelector('.answer-input');
        if (!container.classList.contains('not-needed') && !container.classList.contains('more-info')) {
            answerInput.focus();
        }
    }

    updateAnalysisFieldStatus(container, index) {
        if (!container) return;

        container.classList.remove('has-value', 'not-needed', 'f', 'red', 'green', 'placeholder', 'more-info');

        const answer = this.analysisAnswers[index];
        if (!answer) return;

        if (this.analyzer.isFraudScenario(this.currentScenario)) {
            if (answer.state === 'answered') {
                container.classList.add('f', answer.answer.toLowerCase());
            } else if (answer.state === 'unanswered') {
                container.classList.add('f', 'placeholder');
            }
            // 'inactive' state has no classes
        } else {
            if (answer.state === 'answered') {
                container.classList.add('has-value');
            } else if (answer.state === 'notNeeded') {
                container.classList.add('not-needed');
            } else if (answer.state === 'moreInfo') {
                container.classList.add('more-info');
            }
        }
    }

    handleFieldDoubleClick(event, index) {
        event.preventDefault();
        const container = event.currentTarget;
        const isFraud = this.analyzer.isFraudScenario(this.currentScenario);

        if (isFraud) {
            // Toggle between placeholder and inactive state for fraud scenarios
            if (container.classList.contains('placeholder')) {
                // Switch to inactive state
                container.classList.remove('f', 'placeholder', 'green', 'red');
                container.querySelector('.f.green').style.display = 'none';
                container.querySelector('.f.red').style.display = 'none';
                container.querySelector('.fraud-input').style.display = 'none';
                this.analysisAnswers[index] = { answer: 'NOT_REQUIRED', state: 'inactive' };
            } else {
                // Switch to placeholder state
                container.classList.add('f', 'placeholder');
                container.classList.remove('green', 'red');
                container.querySelector('.f.green').style.display = 'block';
                container.querySelector('.f.red').style.display = 'none';
                container.querySelector('.fraud-input').style.display = 'none';
                this.analysisAnswers[index] = { answer: '', state: 'unanswered' };
            }
        } else {
            // Existing behavior for non-fraud scenarios
            if (container.classList.contains('not-needed')) {
                container.classList.remove('not-needed');
                container.querySelector('.answer-input').style.display = 'block';
                this.analysisAnswers[index] = { answer: '', state: 'unanswered' };
            } else {
                container.classList.add('not-needed');
                container.querySelector('.answer-input').style.display = 'none';
                this.analysisAnswers[index] = { answer: 'NOT_REQUIRED', state: 'notNeeded' };
            }
        }

        this.updateAnalysisFieldStatus(container, index);
        this.updateAnalysisOutput();
    }

    handleFieldRightClick(event, index) {
        event.preventDefault();
        this.toggleMoreInfo(index);
    }

    toggleNeeded(index) {
        const container = this.getFieldContainer(index);
        if (!container) return;

        const answerInput = container.querySelector('.answer-input');
        const isNotNeeded = container.classList.toggle('not-needed');

        container.classList.remove('more-info', 'has-value');

        if (isNotNeeded) {
            if (answerInput) {
                answerInput.style.display = 'none';
                answerInput.value = '';
            }
            this.analysisAnswers[index] = {
                ...this.analysisAnswers[index],
                state: 'notNeeded',
                answer: '',
                moreInfo: false
            };
        } else {
            if (answerInput) {
                answerInput.style.display = 'inline-block';
            }
            this.analysisAnswers[index] = {
                ...this.analysisAnswers[index],
                state: 'unanswered',
                moreInfo: false
            };
        }

        this.updateAnalysisOutput();
    }

    toggleMoreInfo(index) {
        const container = this.getFieldContainer(index);
        if (!container) return;
    
        const answerInput = container.querySelector('.answer-input');
        const isMoreInfo = container.classList.toggle('more-info');
    
        container.classList.remove('not-needed', 'has-value');
    
        if (isMoreInfo) {
            if (answerInput) answerInput.style.display = 'none';
            this.analysisAnswers[index] = {
                ...this.analysisAnswers[index],
                state: 'moreInfo',
                moreInfo: true
            };
        } else {
            if (answerInput) {
                answerInput.style.display = 'inline-block';
                if (answerInput.value) {
                    container.classList.add('has-value');
                }
            }
            this.analysisAnswers[index] = {
                ...this.analysisAnswers[index],
                state: answerInput.value ? 'answered' : 'unanswered',
                moreInfo: false
            };
        }
    
        this.updateAnalysisOutput();
    }

    createOptionButton(text, onClick) {
        const button = document.createElement('button');
        button.textContent = text;
        button.addEventListener('click', onClick);
        return button;
    }

    toggleMoreInfo(index) {
        const container = this.getFieldContainer(index);
        if (!container) return;

        const answerInput = container.querySelector('.answer-input');
        const toggleButton = container.querySelector('.toggle-button');
        const isMoreInfo = container.classList.toggle('more-info');

        container.classList.remove('not-needed');
        if (toggleButton) toggleButton.textContent = 'Not Needed';

        if (isMoreInfo) {
            if (answerInput) answerInput.style.display = 'none';
            this.analysisAnswers[index] = {
                ...this.analysisAnswers[index],
                state: 'moreInfo',
                moreInfo: true
            };
        } else {
            if (answerInput) answerInput.style.display = 'inline-block';
            this.analysisAnswers[index] = {
                ...this.analysisAnswers[index],
                state: 'answered',
                moreInfo: false
            };
        }

        this.updateAnalysisOutput();
    }

    showSelectAllOptions() {
        const isFraud = this.analyzer.isFraudScenario(this.currentScenario);
        this.elements.selectAll.style.display = 'none';
        this.elements.selectAllActions.style.display = 'block';
        
        // Update button text based on scenario type
        if (isFraud) {
            this.elements.selectNotNeeded.textContent = 'Not needed';
            this.elements.selectMoreInfo.textContent = 'Red';
            // Add a new button for Green Flags
            if (!this.elements.selectGreenFlags) {
                this.elements.selectGreenFlags = document.createElement('button');
                this.elements.selectGreenFlags.textContent = 'Green';
                this.elements.selectGreenFlags.addEventListener('click', () => this.selectAllAction('greenFlags'));
                this.elements.selectAllActions.appendChild(this.elements.selectGreenFlags);
            }
            this.elements.selectGreenFlags.style.display = 'inline-block';
        } else {
            this.elements.selectNotNeeded.textContent = 'Not Needed';
            this.elements.selectMoreInfo.textContent = 'More Info';
            if (this.elements.selectGreenFlags) {
                this.elements.selectGreenFlags.style.display = 'none';
            }
        }
    }

    hideSelectAllOptions() {
        this.elements.selectAllActions.style.display = 'none';
        this.elements.selectAll.style.display = 'block';
    }

    selectAllAction(action) {
        const containers = this.elements.analysisContainer.querySelectorAll('.analysis-field-container');
        const isFraud = this.analyzer.isFraudScenario(this.currentScenario);
        
        containers.forEach((container, index) => {
            if (isFraud) {
                if (action === 'notNeeded') {
                    this.toggleFraudFieldInactive(container, index);
                } else if (action === 'moreInfo') {
                    this.setFraudFieldRed(container, index);
                } else if (action === 'greenFlags') {
                    this.setFraudFieldGreen(container, index);
                }
            } else {
                if (action === 'notNeeded') {
                    this.toggleNonFraudFieldNotNeeded(container, index);
                } else if (action === 'moreInfo') {
                    this.setNonFraudFieldMoreInfo(container, index);
                }
            }
        });
        
        this.hideSelectAllOptions();
        this.updateAnalysisOutput();
    }

    setFraudFieldRed(container, index) {
        const greenContainer = container.querySelector('.f.green');
        const redContainer = container.querySelector('.f.red');
        const fraudInput = container.querySelector('.fraud-input');

        container.classList.remove('placeholder', 'f', 'green');
        container.classList.add('f', 'red');
        greenContainer.style.display = 'none';
        redContainer.style.display = 'block';
        fraudInput.style.display = 'block';
        this.analysisAnswers[index] = { answer: 'RED', state: 'answered' };

        this.updateAnalysisFieldStatus(container, index);
    }

    toggleNonFraudFieldNotNeeded(container, index) {
        if (container.classList.contains('not-needed')) {
            container.classList.remove('not-needed');
            container.querySelector('.answer-input').style.display = 'block';
            this.analysisAnswers[index] = { answer: '', state: 'unanswered' };
        } else {
            container.classList.add('not-needed');
            container.querySelector('.answer-input').style.display = 'none';
            this.analysisAnswers[index] = { answer: 'NOT_REQUIRED', state: 'notNeeded' };
        }
        this.updateAnalysisFieldStatus(container, index);
    }

    setNonFraudFieldMoreInfo(container, index) {
        container.classList.add('more-info');
        container.querySelector('.answer-input').style.display = 'none';
        this.analysisAnswers[index] = { answer: '', state: 'moreInfo' };
        this.updateAnalysisFieldStatus(container, index);
    }

    setFraudFieldGreen(container, index) {
        const greenContainer = container.querySelector('.f.green');
        const redContainer = container.querySelector('.f.red');
        const fraudInput = container.querySelector('.fraud-input');

        container.classList.remove('placeholder', 'f', 'red');
        container.classList.add('f', 'green');
        greenContainer.style.display = 'block';
        redContainer.style.display = 'none';
        fraudInput.style.display = 'block';
        this.analysisAnswers[index] = { answer: 'GREEN', state: 'answered' };

        this.updateAnalysisFieldStatus(container, index);
    }

    toggleFraudFieldInactive(container, index) {
        if (container.classList.contains('placeholder')) {
            // Switch to inactive state
            container.classList.remove('f', 'placeholder', 'green', 'red');
            container.querySelector('.f.green').style.display = 'none';
            container.querySelector('.f.red').style.display = 'none';
            container.querySelector('.fraud-input').style.display = 'none';
            this.analysisAnswers[index] = { answer: 'NOT_REQUIRED', state: 'inactive' };
        } else {
            // Switch to placeholder state
            container.classList.add('f', 'placeholder');
            container.classList.remove('green', 'red');
            container.querySelector('.f.green').style.display = 'block';
            container.querySelector('.f.red').style.display = 'none';
            container.querySelector('.fraud-input').style.display = 'none';
            this.analysisAnswers[index] = { answer: '', state: 'unanswered' };
        }
        this.updateAnalysisFieldStatus(container, index);
    }

    toggleMoreInfo(index) {
        const container = this.getFieldContainer(index);
        if (!container) return;

        const answerInput = container.querySelector('.answer-input');
        const toggleButton = container.querySelector('.toggle-button');
        const isMoreInfo = container.classList.toggle('more-info');

        container.classList.remove('not-needed');
        if (toggleButton) toggleButton.textContent = 'Not Needed';

        if (isMoreInfo) {
            if (answerInput) answerInput.style.display = 'none';
            this.analysisAnswers[index] = {
                ...this.analysisAnswers[index],
                state: 'moreInfo',
                moreInfo: true
            };
        } else {
            if (answerInput) answerInput.style.display = 'inline-block';
            this.analysisAnswers[index] = {
                ...this.analysisAnswers[index],
                state: 'answered',
                moreInfo: false
            };
        }

        this.updateAnalysisOutput();
    }

    getFieldContainer(index) {
        return this.elements.analysisContainer.querySelector(`[data-question-index="${index}"]`);
    }

// End of Analysis

updateAnalysisOutput() {
    let output = '';
    let greenFlags = [];
    let redFlags = [];
    let moreInfoNeeded = [];

    const isFraud = this.analyzer.isFraudScenario(this.currentScenario);
    const questions = this.analyzer.getQuestionsForScenario(this.currentScenario);

    Object.entries(this.analysisAnswers).forEach(([index, data]) => {
        const question = questions[index];
        if (data.state === 'notNeeded' || data.state === 'inactive') {
            return; // Skip not-needed or inactive questions
        }
        if (isFraud) {
            if (data.state === 'answered') {
                const container = this.elements.analysisContainer.querySelector(`[data-question-index="${index}"]`);
                const input = container.querySelector('.fraud-input');
                const flagText = data.answer === 'GREEN' ? question.green : question.red;
                const additionalInfo = input.value ? ` (${input.value})` : '';
                if (data.answer === 'GREEN') {
                    greenFlags.push(flagText + additionalInfo);
                } else if (data.answer === 'RED') {
                    redFlags.push(flagText + additionalInfo);
                }
            }
        } else {
            if (data.state === 'answered') {
                output += `${question.question}: ${data.answer || ''}\n`;
            } else if (data.state === 'moreInfo') {
                moreInfoNeeded.push(question.question);
            }
        }
    });

    if (isFraud) {
        if (greenFlags.length > 0) {
            output += "Green Flags:\n";
            greenFlags.forEach(flag => output += `- ${flag}\n`);
            output += "\n";
        }
        if (redFlags.length > 0) {
            output += "Red Flags:\n";
            redFlags.forEach(flag => output += `- ${flag}\n`);
            output += "\n";
        }
    }

    if (moreInfoNeeded.length > 0) {
        output += 'More info needed, please ask the customer the following questions to proceed with their claim:\n';
        moreInfoNeeded.forEach(q => output += `- ${q}\n`);
    }

    if (this.elements.xAnalysis) {
        this.elements.xAnalysis.value = output;
    } else {
        console.warn('xAnalysis element not found');
    }
}

setupBigSteppers() {
    const bigSteppers = document.getElementById('bigsteppers');
    bigSteppers.addEventListener('click', this.handleBigStepperClick.bind(this));
    
    const resetButton = document.getElementById('resetButton');
    resetButton.addEventListener('click', this.resetToStep3.bind(this));

    this.showButtonsForStep(3);
}

handleBigStepperClick(event) {
    const clickedButton = event.target.closest('.button');
    if (!clickedButton) return;

    const action = clickedButton.getAttribute('data-action');
    this.insertText(action);

    if (action !== 'MI') {
        this.currentStep++;
        if (this.currentStep <= 5) {
            this.showButtonsForStep(this.currentStep);
        }
    }
}

showButtonsForStep(step) {
    const buttons = document.querySelectorAll('#bigsteppers .button');
    buttons.forEach(button => {
        const stepIndicator = button.querySelector('.step-indicator');
        if (stepIndicator && stepIndicator.textContent.includes(`Step ${step}`)) {
            button.style.display = 'inline-block';
        } else {
            button.style.display = 'none';
        }
    });

    const resetButton = document.getElementById('resetButton');
    resetButton.style.display = (step === 4 || step === 5) ? 'inline-block' : 'none';
}

insertText(type) {
    const text = this.prewrittenTexts[type];
    if (!text) return;

    if (['CC', 'FI', 'RE', 'AP'].includes(type)) {
        this.replaceOrAddStep(this.elements.xD, ['CC', 'FI'].includes(type) ? 5 : 4, text);
    } else {
        this.elements.xD.textContent = text;
    }

    this.updateOutput();
}

replaceOrAddStep(element, stepNumber, newText) {
    const lines = element.textContent.split('\n');
    const stepFound = lines.some((line, index) => {
        if (line.startsWith(`Step ${stepNumber}:`)) {
            lines.splice(index, 2, newText);
            return true;
        }
        return false;
    });

    if (!stepFound) {
        lines.push(newText);
    }

    element.textContent = lines.join('\n');
}

resetToStep3() {
    this.currentStep = 3;
    this.showButtonsForStep(3);
    this.elements.xD.textContent = '';
    this.updateOutput();
}

    updateAnalysis(parsedClaim) {
        if (!this.analyzer) {
            console.warn('Analyzer not initialized');
            return;
        }

        const analysis = this.analyzer.analyze(parsedClaim);
        if (this.elements.xAnalysis) {
            this.elements.xAnalysis.value = analysis;
        } else {
            console.warn('xAnalysis element not found');
        }
    }
    refreshOutput() {
        this.updateOutput();
      }
    
      updateOutput() {
        let step1Content = '';
        let step2Content = '';
      
        // Step 1: Assessment
        const step1Fields = {
          'scenario': 'Claim Scenario',
          'status': 'Pre Review Claim Status',
          'duplicate': '<font color=orange>Duplicate</font>',
          'merchantCredit': 'MC (Partial/Full)',
          'withdrew': 'Withdrew',
          'matchingAdjustment': '<font color=orange>Matching Adjustment</font>'
        };
      
        Object.entries(step1Fields).forEach(([fieldName, label]) => {
          const field = this.state.fields[fieldName];
          let value = '';
      
          if (fieldName === 'merchantCredit' || fieldName === 'withdrew') {
            const selectedButton = field.container.querySelector('.selected');
            if (selectedButton) {
              value = selectedButton.textContent;
              if (value !== 'No') {
                const details = field.detailsInput?.value || '';
                value += details ? ': ' + details : '';
              }
            } else {
              value = 'No';
            }
          } else if (field && field.value) {
            value = field.value.value || '';
          }
      
          step1Content += `<p>${label}:${value}</p>`;
        });
      
        // Step 2: Findings
        const step2Fields = {
          'claimAmount': 'Claim Amount',
          'disputeCategory': 'Dispute Category',
          'sixtyDayLiability': '60 Day Liability',
          'moreThanTwoYears': 'Tran more than 2yrs',
          'elderlyAbuse': 'Elderly Abuse'
        };
      
        Object.entries(step2Fields).forEach(([fieldName, label]) => {
          const field = this.state.fields[fieldName];
          const value = field && field.value ? field.value.value : '';
          step2Content += `<p>${label}: ${value}</p>`;
        });
      
        // FPF Indicators
        step2Content += '<h3>FPF Indicators:</h3>';
        const fpfFields = {
          'customerSince': 'Customer since',
          'openDate': 'Open date',
          'ytdAvgBal': 'YTD Avg Bal',
          'nsf': 'NSF',
          'dateOfBirth': 'DOB',
          'claimsFiledLess1yr': 'Claims filed less 1yr',
          'immediateUseOfFunds': 'Immediate use of funds',
          'pcUsedToFundOtherClaims': 'PC Used to fund other claims',
          'unusualDepositPriorToReporting': 'Unusual deposit prior to reporting'
        };
      
        Object.entries(fpfFields).forEach(([fieldName, label]) => {
          const field = this.state.fields[fieldName];
          const value = field && field.value ? field.value.value : '';
          step2Content += `<p>${label}: ${value}</p>`;
        });
      
        // Insights/Analysis
        step2Content += '<h3>Insights/Analysis (Red/Green):</h3>';
        if (this.elements.xAnalysis) {
          step2Content += this.elements.xAnalysis.value.replace(/\n/g, '<br>');
        }
      
        this.updateOutputSection('step1Content', step1Content);
        this.updateOutputSection('step2Content', step2Content);
      
        // Decision, Claim Resolution Action, and Next Steps
        if (this.elements.xD) {
            const decisionText = this.elements.xD.value;
            const steps = decisionText.split(/Step \d+:/);
            
            if (steps.length > 1) {
            let step3Content = steps[1].trim();
            // Remove redundant "Decision" at the beginning if present
            step3Content = step3Content.replace(/^Decision\s+/, '');
            // Replace line breaks with <br> tags
            step3Content = step3Content.replace(/\n/g, '<br>');
            this.updateOutputSection('step3Content', step3Content);
            }
            if (steps.length > 2) {
            let step4Content = steps[2].trim();
            // Remove redundant "Claim Resolution Action" at the beginning if present
            step4Content = step4Content.replace(/^Claim Resolution Action\s+/, '');
            // Replace line breaks with <br> tags
            step4Content = step4Content.replace(/\n/g, '<br>');
            this.updateOutputSection('step4Content', step4Content);
            }
            if (steps.length > 3) {
            let step5Content = steps[3].trim();
            // Remove redundant "Next steps (If applicable)" at the beginning if present
            step5Content = step5Content.replace(/^Next steps \(If applicable\)\s+/, '');
            // Replace line breaks with <br> tags
            step5Content = step5Content.replace(/\n/g, '<br>');
            this.updateOutputSection('step5Content', step5Content);
            }
        }
      }

    handleClear(e) {
        const box = e.target.closest('.box');
        const textarea = box.querySelector('textarea');
        const editableDiv = box.querySelector('[contenteditable]');
        if (textarea) textarea.value = '';
        if (editableDiv) editableDiv.textContent = '';
        this.updateOutput();
        this.resetLayout();
    }

    async handleCopy() {
        const textToCopy = this.elements.xOutput.innerText || this.elements.xOutput.textContent;
    
        try {
            if (navigator.clipboard && window.isSecureContext) {
                // Use the Clipboard API if available and in a secure context
                await navigator.clipboard.writeText(textToCopy);
                this.showCopyFeedback('Copied to clipboard!');
            } else {
                // Fallback for older browsers or non-secure contexts
                const textArea = document.createElement('textarea');
                textArea.value = textToCopy;
                textArea.style.position = 'fixed';  // Avoid scrolling to bottom
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
    
                try {
                    document.execCommand('copy');
                    this.showCopyFeedback('Copied to clipboard!');
                } catch (err) {
                    console.error('Fallback: Oops, unable to copy', err);
                    this.showCopyFeedback('Copy failed. Please try again.');
                } finally {
                    document.body.removeChild(textArea);
                }
            }
        } catch (err) {
            console.error('Failed to copy: ', err);
            this.showCopyFeedback('Copy failed. Please try again.');
        }
    }
    
    showCopyFeedback(message) {
        // Create a temporary element for feedback
        const feedback = document.createElement('div');
        feedback.textContent = message;
        feedback.style.position = 'fixed';
        feedback.style.bottom = '20px';
        feedback.style.left = '50%';
        feedback.style.transform = 'translateX(-50%)';
        feedback.style.padding = '10px 20px';
        feedback.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        feedback.style.color = 'white';
        feedback.style.borderRadius = '5px';
        feedback.style.zIndex = '1000';
    
        document.body.appendChild(feedback);}



    

    formatTime(totalSeconds) {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(seconds)}`;
    }

    pad(num) {
        return num.toString().padStart(2, '0');
    }

    handleLogClaim() {
        console.log('Log claim clicked');
        // Implement log claim functionality
    }

    handleCustomizeShortcuts() {
        console.log('Customize shortcuts clicked');
        // Implement shortcut customization
    }

    debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    appendToInput(text) {
        const currentText = this.elements.xInput.value;
        const newText = text + currentText;  // Prepend the new text
        this.elements.xInput.value = newText;
        this.handleInput({ target: { value: newText } });
        this.updateTitle('Result');

        // Scroll to the top of the input
        this.elements.xInput.scrollTop = 0;
    }
}


const COLOR_SCHEMES = {
    dark: {
        primary: 'linear-gradient(rgba(255, 255, 255, 0.034), rgba(49, 49, 49, 0.425)), linear-gradient(to top, #000000, #0e0e0e, #111)',
        secondary: '#222222',
        accent: '#00B2B2',
        bg: 'rgba(0, 0, 0, 0.911)',
        text: '#dbd7bc',
        greenField: 'rgba(53, 255, 53, 0.1)'

    },
    light: {
        primary: '#F0F4F8',
        secondary: '#E2E8F0',
        accent: '#00B2B2',
        bg: '#FFFFFF',
        text: '#000000',
        greenField: 'rgba(0, 200, 0, 0.1)'

    },
    lightGradient: {
        primary: 'linear-gradient(rgba(255, 255, 255, 0.8), rgba(240, 244, 248, 0.9)), linear-gradient(to bottom, #F0F4F8, #E2E8F0, #CBD5E0)',
        secondary: '#E2E8F0',
        accent: '#00B2B2',
        bg: 'rgba(255, 255, 255, 0.95)',
        text: '#000000',
        greenField: 'rgba(47, 138, 29, 1)'

    }
};

class ColorSchemeManager {
    constructor() {
        this.state = {
            currentScheme: 'dark'
        };
        this.init();
    }

    init() {
        const toggle = document.getElementById('colorSchemeToggle');
        toggle.addEventListener('click', () => this.cycleColorScheme());
        this.updateColors();
    }

    cycleColorScheme() {
        const schemes = Object.keys(COLOR_SCHEMES);
        const currentIndex = schemes.indexOf(this.state.currentScheme);
        const nextIndex = (currentIndex + 1) % schemes.length;
        this.state.currentScheme = schemes[nextIndex];
        this.updateColors();
        this.updateToggleButton();
    }

    updateColors() {
        const root = document.documentElement;
        const scheme = COLOR_SCHEMES[this.state.currentScheme];
        
        // Remove all scheme classes
        root.classList.remove('light-mode', 'light-gradient-mode');
        
        // Add the appropriate class based on the current scheme
        if (this.state.currentScheme === 'light') {
            root.classList.add('light-mode');
        } else if (this.state.currentScheme === 'lightGradient') {
            root.classList.add('light-gradient-mode');
        }
        
        // Update other CSS variables as before
        for (const [property, value] of Object.entries(scheme)) {
            root.style.setProperty(`--${property}`, value);
        }
    }

    updateToggleButton() {
        const toggle = document.getElementById('colorSchemeToggle');
        const icons = {
            dark: '🌙',
            light: '☀️',
            lightGradient: '🌈'
        };
        toggle.textContent = icons[this.state.currentScheme];
    }
}

// Initialize the color scheme manager
const colorSchemeManager = new ColorSchemeManager();

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initializeProductivity();
    console.log('DOM content loaded, creating ClaimManagementTool');
    window.claimTool = new ClaimManagementTool();
    console.log('ClaimManagementTool created');
});