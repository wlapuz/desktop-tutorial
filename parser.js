// parser.js

const scenarioMappings = {
    "Damaged or Defective merchandise": "DFDM",
    "Merchandise not received": "MNRC",
    "Not as described": "NADR",
    "Services not rendered": "SNRN",
    "Misrepresentation": "MRPT",
    "Cancelled recurring": "CNRX",
    "Credit not processed": "CRNP",
    "Deposit Adjustment": "DPAD",
    "Deposit posting error": "DPST",
    "Duplicate processing": "DPPR",
    "Missing deposit": "MIDP",
    "Overcharged": "OCHG",
    "Paid by other means": "PBOM",
    "Shorted funds": "SHFU",
    "Account Take Over": "ATO",
    "Third Party Inducement": "TPI",
    "Counterfeit scenario": "Counterfeit",
    "Counterfeit digital wallet": "Cnft Digital",
    "Lost card": "Lost card",
    "Stolen card": "Stolen card",
    "Lost/Stolen digital wallet": "Lst/Stl Dgtl",
    "Non Receipt of card": "Non Receipt",
    "Unauthorized MOTO": "Unauth MOTO"
};

const fieldPatterns = {
    accountNumber: /Reference Number:\s*(\d+)/,
    scenario: new RegExp(`Show Additional Information.*?(${Object.keys(scenarioMappings).join('|')})`, 'i'),
    status: /Status(?:\s+Code)?:\s*((?:Provisional Credit Issued - Recovery Pending|Pending|Closed|Waiting Approval of Financial Transactions|Waiting for Approval of Denial)(?:\s+\(\d+\))?)/i,
    claimAmount: /Claim Amount:\s*(\$[\d,]+\.\d{2})/,
    customerSince: /Customer Since:\s*(\d{2}\/\d{2}\/\d{4})/,
    dateOfBirth: /Birth Date:\s*(\d{2}\/\d{2}\/\d{4})/,
    openDate: /Open Date:?\s*(\d{2}\/\d{2}\/\d{4})/i,
    ytdAvgBal: /Average Balance YTD[:\s]*\$?([\d,]+\.?\d*)/i,
    nsf: /OD\/NSF Occurrences Past 12 Months[:\s]*(\d+)/i,
    transactionDate: /Transactions:[\s\S]*?Date[\s\S]*?(\d{2}\/\d{2}\/\d{4})/
};

export function parseClaimInfo(text) {
    const parsedClaim = {};

    Object.entries(fieldPatterns).forEach(([key, pattern]) => {
        const match = text.match(pattern);
        if (match) {
            parsedClaim[key] = key === 'scenario' ? scenarioMappings[match[1]] || match[1] : match[1].trim();
        }
    });

    parsedClaim.disputeCategory = determineDisputeCategory(text);
    parsedClaim.sixtyDayLiability = text.includes("Meets 60 day liability rule") ? "Yes" : "No";
    parsedClaim.moreThanTwoYears = determineMoreThanTwoYears(parsedClaim.transactionDate);

    return parsedClaim;
}

function determineDisputeCategory(text) {
    const fraudKeywords = ["Account Take Over", "Third Party Inducement", "Counterfeit", "Lost", "Non Receipt of card", "Unauthorized MOTO"];
    return fraudKeywords.some(keyword => text.includes(keyword)) ? "Fraud" : "Non-Fraud";
}

function determineMoreThanTwoYears(dateString) {
    if (!dateString) return "Unable to determine";

    const transactionDate = new Date(dateString);
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

    return transactionDate < twoYearsAgo ? "Yes" : "No";
}