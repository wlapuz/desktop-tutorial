//analyzer.js

export class ClaimAnalyzer {
    constructor() {
        this.analysisQuestions = {
            // Non-Fraud scenarios (existing code)
            "DFDM": [
                { question: "Defect description?", notRequired: false },
                { question: "Item purchased?", notRequired: false },
                { question: "Estimated delivery date?", notRequired: false },
                { question: "Return details?", notRequired: false },
                { question: ">16 days since return?", notRequired: false }
            ],
            "MNRC": [
                { question: "Item purchased?", notRequired: false },
                { question: "Estimated delivery date?", notRequired: false },
                { question: "Received late & attempted return?", notRequired: false },
                { question: "Cancellation date?", notRequired: false },
                { question: "Cancellation reason?", notRequired: false }
            ],
            "NADR": [
                { question: "Item & reason for NADR?", notRequired: false },
                { question: "Expected service/delivery date?", notRequired: false },
                { question: "Attempted resolution with merchant?", notRequired: false },
                { question: "Cancellation/Return date?", notRequired: false },
                { question: ">16 days since return?", notRequired: false }
            ],
            "SNRN": [
                { question: "Service purchased?", notRequired: false },
                { question: "Expected service date?", notRequired: false },
                { question: "Attempted resolution with merchant?", notRequired: false },
                { question: "Cancellation date?", notRequired: false },
                { question: "Cancellation reason?", notRequired: false }
            ],
            "MRPT": [
                { question: "Purchase details?", notRequired: false },
                { question: "Date merchant contacted?", notRequired: false },
                { question: "Misrepresentation details?", notRequired: false },
                { question: "Date received?", notRequired: false },
                { question: "Date canceled/returned?", notRequired: false },
                { question: "Agreed to future transactions?", notRequired: false },
                { question: "7-day billing notification received?", notRequired: false }
            ],
            "CNRX": [
                { question: "Cancellation date?", notRequired: false },
                { question: "Cancellation reason?", notRequired: false },
                { question: "Merchant contact details?", notRequired: false }
            ],
            "CRNP": [
                { question: "Cancellation date?", notRequired: false },
                { question: "Purchase description?", notRequired: false },
                { question: "Expected/received date?", notRequired: false },
                { question: "Return date?", notRequired: false },
                { question: "Invoice/tracking number?", notRequired: false },
                { question: "Attempted resolution with merchant?", notRequired: false },
                { question: ">16 days since return/cancellation?", notRequired: false }
            ],
            "DPAD": [
                { question: " ", notRequired: false }
            ],
            "DPST": [
                { question: "Legal line vs deposit amount mismatch?", notRequired: false },
                { question: "EIV maker item match?", notRequired: false },
                { question: "Deposit Review error confirmed?", notRequired: false },
                { question: "TI error found?", notRequired: false }
            ],
            "DPPR": [
                { question: "Ch can provide valid transation?", notRequired: false },
                { question: "VROL supports duplicate processing?", notRequired: false }
            ],
            "MIDP": [
                { question: "Deposit confirmed in Chase systems?", notRequired: false },
                { question: "CMM check?", notRequired: false },
                { question: "Valid deposit receipt provided?", notRequired: false },
                { question: "TI error/sequence numbers?", notRequired: false },
                { question: "Chip enabled deposit?", notRequired: false },
                { question: "No irregular activity within same timeframe?", notRequired: false }
            ],
            "OCHG": [
                { question: "Overcharge amount?", notRequired: false },
                { question: "Transaction receipt w/ overcharge info?", notRequired: false },
            ],
            "PBOM": [
                { question: "Chase-verified other payment?", notRequired: false },
                { question: "Non-Chase payment proof in 10 days?", notRequired: false },
                { question: "$500+ claim: signed statement in 10 days?", notRequired: false },
            ],
            "SHFU": [
                { question: "TI error message?", notRequired: false },
                { question: "Machine imbalance/funds not received?", notRequired: false }
            ],
    // Fraud scenarios (restructured)
            "ATO": [
                { questionGreen: "Customer disputing all transactions performed on card that wasn't received (Excludes 522 or MOTO 2 transactions)", questionRed: "Customer not disputing all transactions performed on card that wasn't received (Excludes 522 or MOTO 2 transactions)", notRequired: false },
                { questionGreen: "Invalid PIN attempts (i.e. N/A if PIN mailer sent)", questionRed: "No invalid PIN attempts (i.e. N/A if PIN mailer sent)", notRequired: false },
                { questionGreen: "Out of pattern transactions: No history of valid transactions at same merchant location / terminal as disputed transactions or disputed transactions not similar in frequency and dollar amounts of customers previous valid transactions at same merchant location / terminal", questionRed: "Two or more undisputed transactions at same merchant location / terminal as disputed transactions for similar frequencies and dollar amounts", notRequired: false },
                { questionGreen: "When disputed transaction recurring (i.e. code 522 or MOTO 2), related previous transactions also disputed", questionRed: "Transaction recurring (i.e. code 522 or MOTO 2) and previous transactions not being disputed", notRequired: false },
                { questionGreen: "Recent changes to customer information (i.e. email, phone, address, etc.)", questionRed: "No recent changes to customer information (i.e. email, phone, address, etc.)", notRequired: false },
                { questionGreen: "Third party fraud indicators present.", questionRed: null, notRequired: false },
                { questionGreen: null, questionRed: "FPF indicators present", notRequired: false },
                { questionGreen: "Transactions attempted after card closure", questionRed: null, notRequired: false },
                { questionGreen: "Card mailed to alternative address", questionRed: null, notRequired: false }
            ],
            "TPI": [
                { questionGreen: "Customer tricked into giving account info/access (e.g., ATM, debit card) \nSomeone else used the info to make transactions \nCustomer didn't approve transactions \nCustomer didn't receive benefit", questionRed: "Customer benefited from the transactions \nCustomer made the transactions themselves", notRequired: false }
            ],
            "Counterfeit": [
                { questionGreen: "Out of pattern transactions: No history of valid transactions at the same merchant location / terminal of disputed transactions OR disputed transactions not similar in frequency and dollar amounts of customers' previous valid transactions at the same merchant location / terminal", questionRed: "Two or more undisputed transactions at the same merchant location / terminal as disputed transactions for similar frequencies and dollar amounts", notRequired: false },
                { questionGreen: "TASER NG shows customer confirmed transaction fraud", questionRed: "TASER NG shows customer confirmed transaction valid", notRequired: false },
                { questionGreen: "Disputed transaction recurring (i.e., code 522 or MOTO 2) and related previous transactions also disputed", questionRed: "Disputed transaction recurring (i.e., code 522 or MOTO 2) and related previous transactions not disputed", notRequired: false },
                { questionGreen: "Transaction at chip-enabled ATM/merchant terminal where TI shows fallback transaction", questionRed: "Transaction at chip-enabled ATM/merchant terminal where TI does not show fallback transaction", notRequired: false },
                { questionGreen: "Transaction conducted outside of the customer's geographic area or current transacting area", questionRed: "Transactions conducted within the geographical area", notRequired: false },
                { questionGreen: "Chip-enabled card only: \n• Used at a chip-enabled ATM terminal (i.e., can't be a fallback transaction) \n• Used with PIN-based transactions (e.g., 543, 515 transaction codes) ", questionRed: "Chip enabled card only: \n• Abnormal deposits fund disputed transactions \n• The following can be used to support chip-enabled card Red Flag: \n• PIN used to conduct transactions \n• ZIP Code entered at the time of purchase for authentication (AVS) \n• Contactless Chip POS 07 transactions treated as card-present, EMV-enabled transactions", notRequired: false }
            ],
            "Lost card": [
                { questionGreen: "Out of pattern transactions: No history of valid transactions at the same merchant location / terminal of disputed transactions OR disputed transactions not similar in frequency and dollar amounts of customers' previous valid transactions at the same merchant location / terminal", questionRed: "Two or more undisputed transactions at the same merchant location / terminal as disputed transactions for similar frequencies and dollar amounts", notRequired: false },
                { questionGreen: "Invalid PIN attempts (i.e., N/A if the PIN was carried with the card)", questionRed: "No invalid PIN attempts (i.e., N/A if the PIN was carried with the card)", notRequired: false },
                { questionGreen: "TASER NG shows customer confirmed transaction fraud", questionRed: "TASER NG shows customer confirmed transaction valid", notRequired: false },
                { questionGreen: "Customer disputing all card-present transactions performed after the first disputed transaction", questionRed: "Customer not disputing all card-present transactions performed after the first disputed transaction", notRequired: false },
                { questionGreen: "Disputed transaction recurring (i.e., code 522 or MOTO 2) and related previous transactions also disputed", questionRed: "Disputed transaction recurring (i.e., code 522 or MOTO 2) and related previous transactions not disputed", notRequired: false },
                { questionGreen: "Card present transactions attempted after card closure", questionRed: null, notRequired: false },
                { questionGreen: null, questionRed: "Abnormal deposits fund disputed transactions", notRequired: false },
                { questionGreen: "Third-party fraud indicators present", questionRed: null, notRequired: false },
                { questionGreen: null, questionRed: "FPF indicators present", notRequired: false }
            ],
            "Stolen card": [
                { questionGreen: "Out of pattern transactions: No history of valid transactions at the same merchant location / terminal of disputed transactions OR disputed transactions not similar in frequency and dollar amounts of customers' previous valid transactions at the same merchant location / terminal", questionRed: "Two or more undisputed transactions at the same merchant location / terminal as disputed transactions for similar frequencies and dollar amounts", notRequired: false },
                { questionGreen: "Invalid PIN attempts (i.e., N/A if the PIN was carried with the card)", questionRed: "No invalid PIN attempts (i.e., N/A if the PIN was carried with the card)", notRequired: false },
                { questionGreen: "TASER NG shows customer confirmed transaction fraud", questionRed: "TASER NG shows customer confirmed transaction valid", notRequired: false },
                { questionGreen: "Customer disputing all card-present transactions performed after the first disputed transaction", questionRed: "Customer not disputing all card-present transactions performed after the first disputed transaction", notRequired: false },
                { questionGreen: "Disputed transaction recurring (i.e., code 522 or MOTO 2) and related previous transactions also disputed", questionRed: "Disputed transaction recurring (i.e., code 522 or MOTO 2) and related previous transactions not disputed", notRequired: false },
                { questionGreen: "Card present transactions attempted after card closure", questionRed: null, notRequired: false },
                { questionGreen: null, questionRed: "Abnormal deposits fund disputed transactions", notRequired: false },
                { questionGreen: "Third-party fraud indicators present", questionRed: null, notRequired: false },
                { questionGreen: null, questionRed: "FPF indicators present", notRequired: false }
            ],
            "Lst/Stl Dgtl": [
                { questionGreen: "New devices recently added to the online profile", questionRed: "No new devices recently added to the online profile", notRequired: false },
                { questionGreen: "Password change/demographic changes before unauthorized activity", questionRed: "No password change/demographic changes before unauthorized activity", notRequired: false },
                { questionGreen: "Customer didn't allow persons access to the device that houses the Digital Wallet and suspects they conducted the transaction", questionRed: "Customer allowed persons access to the device that houses the Digital Wallet", notRequired: false },
                { questionGreen: "No login to chase.com from a lost/stolen device with biometric login credentials after the device was lost/stolen", questionRed: "Successful login to chase.com from a lost/stolen device with biometric login credentials after the device was lost/stolen", notRequired: false },
                { questionGreen: "Customer didn't share sign-on passwords/PINs required to make purchases or conduct activity", questionRed: "Customer shared sign-on, passwords/PINs required to make purchases or conduct activity", notRequired: false },
                { questionGreen: "Customer disputing all transactions done with the token ID after the first fraudulent transaction", questionRed: "Customer not disputing all non-recurring transactions done with the token ID after the first fraudulent transaction", notRequired: false },
                { questionGreen: "Invalid ZIP Code attempts \nInvalid PIN attempts found", questionRed: null, notRequired: false },
                { questionGreen: "Third-party fraud indicators present", questionRed: null, notRequired: false },
                { questionGreen: null, questionRed: "FPF indicators present", notRequired: false }
            ],
            "Non Receipt": [
                { questionGreen: "Card not activated at a terminal previously used by the customer within the last six months", questionRed: null, notRequired: false },
                { questionGreen: null, questionRed: "Card sent to the mailing address on file with no PIN mailer and card activated at a terminal used by the customer within the last six months", notRequired: false },
                { questionGreen: "Customer disputing all transactions performed on a card not received (Excludes 522 or MOTO 2 transactions)", questionRed: "Customer not disputing all transactions performed on a card not received (i.e., can't be code 522 or MOTO 2)", notRequired: false },
                { questionGreen: "Invalid PIN attempts (i.e., N/A if the PIN was carried with the card)", questionRed: "No invalid PIN attempts (i.e., N/A if the PIN was carried with the card)", notRequired: false },
                { questionGreen: "Out of pattern transactions: No history of valid transactions at the same merchant location / terminal of disputed transactions OR disputed transactions not similar in frequency and dollar amounts of customers' previous valid transactions at the same merchant location / terminal", questionRed: "Two or more undisputed transactions at the same merchant location / terminal as disputed transactions for similar frequencies and dollar amounts", notRequired: false },
                { questionGreen: "Disputed transaction recurring (i.e., code 522 or MOTO 2) and related previous transactions also disputed", questionRed: "Disputed transaction recurring (i.e., code 522 or MOTO 2) and related previous transactions not disputed", notRequired: false },
                { questionGreen: "Transactions attempted after card closure", questionRed: null, notRequired: false },
                { questionGreen: "Third-party fraud indicators present", questionRed: null, notRequired: false },
                { questionGreen: null, questionRed: "FPF indicators present", notRequired: false }
            ],
            "Unauth MOTO": [
                { questionGreen: "Out of pattern transactions: No history of valid transactions at the same merchant location / terminal of disputed transactions OR disputed transactions not similar in frequency and dollar amounts of customers' previous valid transactions at the same merchant location / terminal", questionRed: "Two or more undisputed transactions at the same merchant location / terminal as disputed transactions for similar frequencies and dollar amounts", notRequired: false },
                { questionGreen: "Disputed transaction recurring (i.e., code 522 or MOTO 2) and related previous transactions also disputed", questionRed: "Disputed transaction recurring (i.e., code 522 or MOTO 2) and related previous transactions not disputed", notRequired: false },
                { questionGreen: "Subscription merchants: Initial sign-up transaction also disputed (customer didn't authorize subscription)", questionRed: "Subscription merchants: Initial sign-up transaction valid but following charges reported as fraud (i.e., shows claim Non Fraud)", notRequired: false },
                { questionGreen: "Third-party fraud indicators present", questionRed: null, notRequired: false },
                { questionGreen: null, questionRed: "FPF indicators present", notRequired: false }
            ]
        };
    }

    analyze(parsedClaim) {
        const scenario = parsedClaim.scenario;
        const isFraud = this.isFraudScenario(scenario);
        
        let analysis = `Scenario: ${scenario}\n\n`;
        
        const questions = this.getQuestionsForScenario(scenario);
        return questions;
    }

    isFraudScenario(scenario) {
        return ["ATO", "TPI", "Counterfeit", "Cnft Digital", "Lost card", "Stolen card", "Lst/Stl Dgtl", "Non Receipt", "Unauth MOTO"].includes(scenario);
    }

    getQuestionsForScenario(scenario) {
        if (this.isFraudScenario(scenario)) {
            return this.analysisQuestions[scenario].map((flag, index) => ({
                green: flag.questionGreen,
                red: flag.questionRed,
                notRequired: false
            }));
        } else {
            return this.analysisQuestions[scenario] || [];
        }
    }

    validateAnalysisAnswers(scenario, answers) {
        const questions = this.getQuestionsForScenario(scenario);
        let isValid = true;
        let unansweredQuestions = [];

        questions.forEach((q, index) => {
            if (!answers[index] && !q.notRequired) {
                isValid = false;
                unansweredQuestions.push(q.question);
            }
        });

        return { isValid, unansweredQuestions };
    }

}