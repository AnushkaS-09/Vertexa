// Structured task data. Replace `buildSteps()` with a real API call later
// without touching any component code — see README for the future-backend plan.

const src = (url, note) => ({ url, note });

export const tasks = {
  cloudKitchen: {
    label: "Open a Cloud Kitchen",
    location: "Mumbai, Maharashtra",
    tags: ["Business", "Food Safety", "Municipal", "Tax", "Premises"],
    questions: [
      {
        id: "structure",
        prompt: "What type of business structure are you planning?",
        options: [
          ["proprietorship", "Individual / Proprietorship"],
          ["partnership", "Partnership / LLP"],
          ["company", "Private Limited Company"],
          ["notdecided", "Not decided"]
        ]
      },
      {
        id: "premises",
        prompt: "Do you already have a premises?",
        options: [
          ["yes", "Yes"],
          ["no", "No"],
          ["notdecided", "Not decided"]
        ]
      }
    ],
    buildSteps(answers) {
      const structure = answers.structure || "notdecided";
      const steps = [
        {
          id: "structure",
          title: "Choose Business Structure",
          type: "mandatory",
          prerequisites: [],
          authority: "—",
          description:
            "Decide the legal form of the business — this determines which registrations below actually apply to you.",
          documents: [],
          estTime: "Verification required",
          estFee: "Verification required",
          source: src("https://www.startupindia.gov.in")
        },
        {
          id: "udyam",
          title: "Udyam (MSME) Registration",
          type: "conditional",
          prerequisites: ["structure"],
          authority: "Ministry of MSME",
          description:
            "Optional for most small businesses, but unlocks MSME benefits, easier loans, and is often requested by aggregator platforms and landlords.",
          documents: ["PAN", "Aadhaar of proprietor/partners", "Business address"],
          estTime: "Typically same day (online)",
          estFee: "Verification required",
          source: src("https://udyamregistration.gov.in")
        },
        {
          id: "company",
          title: "Company / LLP Incorporation",
          type: "mandatory",
          prerequisites: ["structure"],
          authority: "Ministry of Corporate Affairs (MCA)",
          description:
            "Only applies if you chose Private Limited Company or LLP as your structure. Not required for a proprietorship or an unregistered partnership.",
          documents: ["Digital Signature Certificate", "Director/Partner ID proof", "Registered office proof"],
          estTime: "Verification required",
          estFee: "Verification required",
          source: src("https://www.mca.gov.in"),
          hideUnless: (v) => v === "company"
        },
        {
          id: "pan",
          title: "Obtain Business PAN",
          type: "mandatory",
          prerequisites: ["structure"],
          authority: "Income Tax Department",
          description:
            "Required for tax filing and to open a business bank account. Issued automatically during company/LLP incorporation; applied separately for a proprietorship.",
          documents: ["Identity & address proof"],
          estTime: "Verification required",
          estFee: "Verification required",
          source: src("https://www.incometax.gov.in")
        },
        {
          id: "gst",
          title: "GST Registration",
          type: "conditional",
          prerequisites: ["pan"],
          authority: "Goods and Services Tax Network",
          description:
            "Mandatory once turnover crosses the applicable threshold, and commonly required regardless of turnover if you plan to sell through food-delivery aggregators.",
          documents: ["PAN", "Business address proof", "Bank account details"],
          estTime: "Typically 7 working days (verification required)",
          estFee: "No fee for registration (verification required)",
          source: src("https://www.gst.gov.in")
        },
        {
          id: "premises",
          title: "Secure & Document Premises",
          type: "mandatory",
          prerequisites: [],
          authority: "—",
          description:
            answers.premises === "no"
              ? "You indicated you don't have premises yet — this must be finalized before the food-safety and municipal steps below can proceed."
              : "Confirm the kitchen location and keep ownership/rental proof and a No-Objection Certificate (NOC) from the property owner ready.",
          documents: ["Rent agreement or ownership proof", "NOC from property owner"],
          estTime: "Varies",
          estFee: "—",
          source: null
        },
        {
          id: "fssai",
          title: "FSSAI Registration / License",
          type: "mandatory",
          prerequisites: ["premises", "structure"],
          authority: "Food Safety and Standards Authority of India (FSSAI)",
          description:
            "Every food business needs either Basic Registration, a State License, or a Central License depending on turnover and scale — the exact slab and fee should be confirmed on the official portal.",
          documents: ["Photo ID", "Premises proof", "Food safety management plan"],
          estTime: "Verification required",
          estFee: "Verification required",
          source: src("https://www.fssai.gov.in")
        },
        {
          id: "shops",
          title: "Shops & Establishments Registration (Gumasta)",
          type: "mandatory",
          prerequisites: ["premises"],
          authority: "Department of Labour, Government of Maharashtra",
          description:
            "Required for virtually all commercial establishments in Maharashtra, filed online via the state's citizen services portal.",
          documents: ["Premises proof", "Employer & employee details"],
          estTime: "Typically a few working days (verification required)",
          estFee: "Verification required",
          source: src("https://aaplesarkar.mahaonline.gov.in")
        },
        {
          id: "ready",
          title: "Ready to Operate",
          type: "informational",
          prerequisites: ["fssai", "shops"],
          authority: "—",
          description:
            "Core mandatory registrations are in place. GST and any additional local trade permits should still be confirmed based on your specific operation.",
          documents: [],
          estTime: "—",
          estFee: "—",
          source: null
        }
      ];
      return steps.filter((s) => !s.hideUnless || s.hideUnless(structure));
    }
  },

  smallBusiness: {
    label: "Register a Small Business",
    location: "India (general)",
    tags: ["Business", "Tax"],
    questions: [],
    buildSteps() {
      return [
        {
          id: "structure",
          title: "Choose Business Structure",
          type: "mandatory",
          prerequisites: [],
          authority: "—",
          description: "Proprietorship, partnership, LLP, or private limited company — this shapes every step that follows.",
          documents: [],
          estTime: "Verification required",
          estFee: "—",
          source: src("https://www.startupindia.gov.in")
        },
        {
          id: "udyam",
          title: "Udyam (MSME) Registration",
          type: "conditional",
          prerequisites: ["structure"],
          authority: "Ministry of MSME",
          description: "Recommended for most small businesses to access MSME benefits and easier credit.",
          documents: ["PAN", "Aadhaar"],
          estTime: "Typically same day (online)",
          estFee: "Verification required",
          source: src("https://udyamregistration.gov.in")
        },
        {
          id: "pan",
          title: "Obtain Business PAN",
          type: "mandatory",
          prerequisites: ["structure"],
          authority: "Income Tax Department",
          description: "Needed for tax filing and banking.",
          documents: ["Identity proof"],
          estTime: "Verification required",
          estFee: "Verification required",
          source: src("https://www.incometax.gov.in")
        },
        {
          id: "gst",
          title: "GST Registration",
          type: "conditional",
          prerequisites: ["pan"],
          authority: "GST Network",
          description: "Mandatory once turnover crosses the applicable threshold, or if selling inter-state / via marketplaces.",
          documents: ["PAN", "Address proof"],
          estTime: "Typically 7 working days (verification required)",
          estFee: "No fee for registration (verification required)",
          source: src("https://www.gst.gov.in")
        }
      ];
    }
  },

  drivingLicence: {
    label: "Apply for a Driving Licence",
    location: "India (general)",
    tags: ["Transport"],
    questions: [],
    buildSteps() {
      return [
        {
          id: "learner",
          title: "Apply for Learner's Licence",
          type: "mandatory",
          prerequisites: [],
          authority: "Regional Transport Office (RTO)",
          description: "Apply online and pass an online road-rules test to get your learner's licence.",
          documents: ["Age & address proof", "Passport photo"],
          estTime: "Verification required",
          estFee: "Verification required",
          source: src("https://parivahan.gov.in")
        },
        {
          id: "practice",
          title: "Practice Driving",
          type: "mandatory",
          prerequisites: ["learner"],
          authority: "—",
          description: "Practice for the state-mandated minimum period before booking your permanent licence test.",
          documents: [],
          estTime: "Minimum period varies by state",
          estFee: "—",
          source: null
        },
        {
          id: "test",
          title: "Book & Pass Driving Test",
          type: "mandatory",
          prerequisites: ["practice"],
          authority: "Regional Transport Office (RTO)",
          description: "A practical driving test conducted at the RTO; passing it qualifies you for a permanent licence.",
          documents: ["Learner's licence"],
          estTime: "By appointment (verification required)",
          estFee: "Verification required",
          source: src("https://parivahan.gov.in")
        },
        {
          id: "issue",
          title: "Receive Permanent Driving Licence",
          type: "mandatory",
          prerequisites: ["test"],
          authority: "Regional Transport Office (RTO)",
          description: "Issued after the test is passed; usually delivered by post or downloadable from the portal.",
          documents: [],
          estTime: "Verification required",
          estFee: "Verification required",
          source: src("https://parivahan.gov.in")
        }
      ];
    }
  },

  birthCertificate: {
    label: "Obtain a Birth Certificate",
    location: "India (general)",
    tags: ["Vital Records", "Municipal"],
    questions: [],
    buildSteps() {
      return [
        {
          id: "report",
          title: "Report the Birth",
          type: "mandatory",
          prerequisites: [],
          authority: "Hospital / local Registrar of Births & Deaths",
          description:
            "Births are typically registered by the hospital; for home births the family must report it to the local registrar within the legally required period.",
          documents: ["Hospital discharge summary, if applicable"],
          estTime: "Within statutory period (verification required)",
          estFee: "—",
          source: src(
            "https://crsorgi.gov.in",
            "National CRS reference site — apply via your local municipal body or state e-District portal"
          )
        },
        {
          id: "apply",
          title: "Apply for the Certificate",
          type: "mandatory",
          prerequisites: ["report"],
          authority: "Local Municipal Corporation / e-District portal",
          description:
            "Submit the application to your local urban local body or the state's e-District service, depending on where the birth was registered.",
          documents: ["Proof of birth registration", "Parents' ID proof"],
          estTime: "Verification required",
          estFee: "Verification required",
          source: null
        },
        {
          id: "receive",
          title: "Receive the Certificate",
          type: "mandatory",
          prerequisites: ["apply"],
          authority: "Local Municipal Corporation",
          description: "Collect in person or download once processed, depending on the issuing authority's system.",
          documents: [],
          estTime: "Verification required",
          estFee: "—",
          source: null
        }
      ];
    }
  }
};

export function findTaskKey(query) {
  const n = query.trim().toLowerCase();
  if (!n) return null;
  if (n.includes("cloud kitchen") || n.includes("kitchen")) return "cloudKitchen";
  if (n.includes("small business") || n.includes("register a business") || n.includes("register business"))
    return "smallBusiness";
  if (n.includes("driving") || n.includes("driver")) return "drivingLicence";
  if (n.includes("birth certificate") || n.includes("birth")) return "birthCertificate";
  return null;
}
