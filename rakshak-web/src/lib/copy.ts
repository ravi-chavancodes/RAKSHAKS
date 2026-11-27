export interface EmergencyService {
  readonly code: "112" | "108" | "101";
  readonly label: string;
  readonly href: string;
}

export interface HeroSlide {
  readonly id: string;
  readonly imageSrc: string;
  readonly imageAlt: string;
  readonly headline: string;
  readonly summary: string;
  readonly ctaLabel: string;
  readonly ctaHref: string;
  readonly secondaryLabel: string;
  readonly secondaryHref: string;
}

export const copy = {
  brand: {
    name: "RAKSHAK",
    tagline: "Emergency reporting and local response coordination.",
    disclaimer:
      "RAKSHAK is a coordination aid. It does not replace official emergency services. In an immediate life-threatening emergency, call 112, 108, or 101 directly.",
  },
  emergencyNumbers: [
    { code: "112", label: "National Emergency", href: "tel:112" },
    { code: "108", label: "Ambulance", href: "tel:108" },
    { code: "101", label: "Fire", href: "tel:101" },
  ] satisfies readonly EmergencyService[],
  nav: {
    home: "Overview",
    report: "Report SOS",
    track: "Track Case",
    dashboard: "My Dashboard",
    responder: "Responder",
    admin: "Admin",
    login: "Sign In",
    adminLogin: "Admin Login",
    emergencyStripLabel: "Direct Helplines",
  },
  landing: {
    hero: {
      headline: "When something goes wrong, the right help should find you.",
      subline:
        "Share your location and situation in under a minute so nearby verified responders can review and accept your case.",
      primaryCta: "Report an emergency",
      secondaryCta: "How it works",
    },
    howItWorks: {
      heading: "How it works",
      steps: [
        {
          number: "1",
          title: "Send your report",
          line: "Share your GPS pin or a nearby landmark, with an optional 10-second voice note.",
        },
        {
          number: "2",
          title: "Confirm the category",
          line: "Review the suggested category so your case routes to the right responder type.",
        },
        {
          number: "3",
          title: "Track real status",
          line: "Follow live updates from Submitted to Accepted without guessing who owns the case.",
        },
      ],
    },
    whoWeHelp: {
      heading: "Who we help",
      cards: [
        {
          id: "human",
          title: "Human",
          description: "Medical distress, road injuries, or immediate personal safety.",
          href: "/report?mode=self",
        },
        {
          id: "animal_bird",
          title: "Animal or Bird",
          description: "Injured street animals, trapped birds, or urban wildlife.",
          href: "/report?mode=third_person",
        },
        {
          id: "fire_rescue",
          title: "Fire or Rescue",
          description: "Active fire, smoke, gas leaks, flooding, or trapped individuals.",
          href: "/report?mode=third_person",
        },
      ],
    },
    trustStrip: {
      sentence:
        "Your location and optional audio stay private to your case and assigned responders. RAKSHAK is a coordination aid, not a replacement for official emergency services.",
    },
    story: {
      scrollPrompt: "Scroll to see how it works",
      skipLabel: "Skip Story",
      captions: [
        {
          id: 1,
          minProgress: 0.15,
          maxProgress: 0.43,
          kicker: "01 · Accident Strikes",
          text: "An unexpected collision leaves a pedestrian injured at the crossing.",
        },
        {
          id: 2,
          minProgress: 0.44,
          maxProgress: 0.72,
          kicker: "02 · Help via RAKSHAK",
          text: "A bystander opens RAKSHAK, captures the scene, and shares live GPS.",
        },
        {
          id: 3,
          minProgress: 0.73,
          maxProgress: 0.92,
          kicker: "03 · Timely Rescue",
          text: "Verified responders accept and an ambulance reaches in time.",
        },
      ],
      finale: {
        badge: "Responder Accepted · On Site",
        heading: "Send an SOS report from any browser.",
        subline:
          "Your case is marked Submitted only after our server saves it. In an emergency, dial 112, 108, or 101 directly.",
        primaryCta: "Report an emergency",
        secondaryCta: "How it works",
      },
    },
  },
  homeSections: {
    sosEntryHeading: "Need emergency coordination?",
    sosEntryLead:
      "Choose who needs help to open the 6-step SOS report. If life or property is in immediate danger, call 112, 108, or 101 directly.",
    sosSelfTitle: "I need help",
    sosSelfDescription: "Report an emergency happening to you right now.",
    sosThirdPersonTitle: "Someone else needs help",
    sosThirdPersonDescription:
      "Report an emergency you witnessed or are coordinating for another person or animal.",
    principlesHeading: "How RAKSHAK handles every report",
    principlesLead:
      "Built for clarity under pressure. Every status change is recorded on the server and visible to both the reporter and the responder.",
    principles: [
      {
        title: "Confirmed before Submitted",
        detail:
          "A case displays Submitted only after the backend confirms storage. Reports never wait on audio uploads or AI analysis.",
      },
      {
        title: "Assigned is not Accepted",
        detail:
          "Assigned means a responder was notified. Accepted means a responder explicitly took ownership of the case.",
      },
      {
        title: "Advisory AI, never medical diagnosis",
        detail:
          "Automated priority suggestions are always labeled AI-suggested and never replace clinical or dispatch assessment.",
      },
    ],
    quickAccessHeading: "Coordination workspaces",
    quickAccess: [
      {
        title: "Citizen SOS Report",
        description: "Submit an incident with GPS or manual location and optional 10-second voice note.",
        href: "/report",
        action: "Open /report",
      },
      {
        title: "Live Case Tracker",
        description: "Check verified status history for a submitted reference code.",
        href: "/track/demo",
        action: "Open /track/[ref]",
      },
      {
        title: "Responder Queue",
        description: "Review notified assignments and explicitly accept or update active cases.",
        href: "/responder",
        action: "Open /responder",
      },
      {
        title: "Operations Admin",
        description: "Inspect case distribution, responder coverage, and status history logs.",
        href: "/admin",
        action: "Open /admin",
      },
    ],
  },
  routes: {
    report: {
      title: "Send an SOS Report",
      stepLabel: "Step",
      ofLabel: "of",
      nextButton: "Next",
      backButton: "Back",
      step1: {
        heading: "Who needs help?",
        selfTitle: "I need help",
        selfDesc: "I am directly involved in this emergency.",
        thirdPersonTitle: "Someone else needs help",
        thirdPersonDesc: "I am reporting for another person, animal, or incident nearby.",
      },
      step2: {
        heading: "Select emergency category",
        hint: "Choose the closest category to continue.",
        categories: {
          human: {
            title: "Human Medical or Safety",
            desc: "Injury, medical distress, road collision, or personal safety.",
          },
          animal_bird: {
            title: "Animal or Bird Rescue",
            desc: "Injured animal, trapped bird, or wildlife in danger.",
          },
          fire_rescue: {
            title: "Fire or Structural Rescue",
            desc: "Active fire, smoke, gas leak, flood, or trapped person.",
          },
        },
      },
      step3: {
        heading: "Describe the situation",
        descriptionLabel: "What is happening? (required, max 500 characters)",
        descriptionPlaceholder:
          "Example: Two-wheeler collision near metro pillar 42, one person with leg injury.",
        contactNameSelf: "Your name (optional)",
        contactNameThird: "Your name (recommended for follow-up)",
        contactPhoneSelf: "Phone number (optional)",
        contactPhoneThird: "Phone number (recommended for follow-up)",
      },
      step4: {
        heading: "Confirm location",
        explanation:
          "Sharing your GPS coordinates helps nearby responders locate the incident faster. You can adjust the pin on the map or enter a manual address if location access is denied.",
        thirdPersonNote:
          "Reporting for someone else? A nearby landmark or street name is acceptable and will be marked as approximate.",
        allowGpsButton: "Share GPS Location",
        requestingGps: "Getting location...",
        useManualButton: "Enter Location Manually",
        gpsConfirmedHint: "Drag the pin if needed to match the exact spot.",
        manualLabel: "Location or nearby landmark",
        manualPlaceholder: "Example: Outside Indiranagar Metro Gate B, Bengaluru",
        approximateLabel: "This location is approximate",
      },
      step5: {
        heading: "Optional 10-second voice note",
        explanation:
          "A short audio clip can help responders understand background conditions if typing is difficult. Only authorized responders and operations administrators can access it in private storage.",
        allowMicButton: "Allow Microphone & Record 10s",
        stopRecordingButton: "Stop Early",
        skipButton: "Skip Audio",
        recordingLabel: "Recording...",
        recordedLabel: "10-second clip attached.",
        reRecordButton: "Record Again",
        deniedMessage:
          "Microphone access was denied or is unavailable on this device. You can continue without audio.",
      },
      step6: {
        heading: "Review and send",
        modeLabel: "Reporting mode",
        categoryLabel: "Category",
        descriptionLabel: "Details",
        locationLabel: "Location",
        audioLabel: "Audio note",
        audioAttached: "Attached (private storage)",
        audioNone: "None",
        submitButton: "Send SOS Report",
        submittingButton: "Sending report...",
        networkErrorMessage:
          "Not submitted yet. Your details are saved on this device. Retry.",
        retryButton: "Retry Submission",
      },
      success: {
        title: "Report received",
        referenceLabel: "Case Reference",
        copyButton: "Copy Reference",
        copiedToast: "Case reference copied.",
        trackButton: "Track this case",
        submitAnother: "Send another report",
        disclaimer:
          "RAKSHAK is a coordination aid and does not replace official emergency services. If someone is in immediate danger, call 112, 108, or 101 directly.",
      },
    },
    track: {
      title: "Track Case Status",
      referenceLabel: "Case Reference",
      notFoundTitle: "Case reference not found",
      notFoundDescription:
        "No submitted report matches this reference code. Check the code or submit a new SOS report.",
      aiBadge: "AI suggestion",
      aiUnavailable: "AI unavailable, using your selected category.",
      aiLowConfidence: "Please confirm your category",
      aiSuggestsPrefix: "AI suggests:",
      aiDoesThisLookRight: "Does this look right?",
      aiPriorityLabel: "AI-suggested priority",
      confirmButton: "Confirm",
      changeButton: "Change",
      confirmedLabel: "Category confirmed by reporter.",
      routingHeading: "Responder Routing",
      noMatchMessage:
        "No registered responder found nearby. Here are official alternatives: 112 / 108 / 101 / local police.",
      availabilityNote: "Availability: not verified",
      timelineHeading: "Status History",
      backHome: "Back to Overview",
    },
    responder: {
      title: "Responder Coordination",
      description:
        "Authenticated responders will review notified cases here, explicitly accept assignments, and record verified status transitions.",
      statusNote: "Foundation route ready. Responder queue andRealtime updates will be wired next.",
      backHome: "Back to Overview",
    },
    admin: {
      title: "Operations Administration",
      description:
        "Coordinators will audit case timelines, responder availability, and server-recorded status_history entries from this view.",
      statusNote: "Foundation route ready. Admin audit views will be wired next.",
      backHome: "Back to Overview",
    },
    login: {
      title: "User Sign In & Registration",
      description:
        "Sign in or register with your email and password. Anonymous SOS reporting on /report does not require an account.",
      signInTab: "Sign In",
      registerTab: "Register",
      fullNameLabel: "Full name",
      fullNamePlaceholder: "Aarav Sharma",
      emailLabel: "Email address",
      emailPlaceholder: "name@example.org",
      passwordLabel: "Password",
      passwordPlaceholder: "Minimum 6 characters",
      submitSignIn: "Sign In",
      submitRegister: "Create Account",
      sendingButton: "Signing in...",
      registeringButton: "Creating account...",
      checkEmailTitle: "Check your email",
      checkEmailDescription: "We sent a confirmation link to",
      checkEmailHint:
        "Open the link in that email to activate your account.",
      useAnotherEmail: "Use a different email",
      callbackError:
        "The sign-in link expired or could not be verified. Sign in below.",
      portalMismatchError:
        "Administrators must sign in through the Admin Login portal (/admin/login).",
      adminPortalLink: "Go to Admin Login",
      backHome: "Back to Overview",
    },
    adminLogin: {
      title: "Operations Admin Sign In",
      description:
        "Restricted access for verified operations administrators. Registration is disabled on this portal.",
      emailLabel: "Administrator email",
      emailPlaceholder: "iamvishalai@gmail.com",
      passwordLabel: "Password",
      passwordPlaceholder: "Enter password",
      submitButton: "Sign In to Admin Panel",
      sendingButton: "Signing in...",
      checkEmailTitle: "Check your email",
      checkEmailDescription: "We sent an administrator sign-in link to",
      checkEmailHint:
        "Open the link in that email to enter the Operations Admin panel.",
      useAnotherEmail: "Use a different email",
      callbackError:
        "The sign-in link expired or could not be verified. Sign in below.",
      portalMismatchError:
        "This account is not an administrator. Please use the standard User Sign In portal.",
      userPortalLink: "Go to User Sign In",
      backHome: "Back to Overview",
    },
    dashboard: {
      title: "User Access Dashboard",
      subtitle: "Review your submitted SOS reports, live status history, and contact profile.",
      newSosButton: "Send SOS Report",
      profileHeading: "Your Profile",
      fullNameLabel: "Full name",
      phoneLabel: "Phone number",
      saveProfile: "Save Profile",
      savingProfile: "Saving...",
      profileSaved: "Profile updated.",
      incidentsHeading: "My Submitted Cases",
      incidentsEmpty: "You have not submitted any SOS reports while signed in yet.",
      statusLegend:
        "Submitted = stored in backend · Assigned = responder notified · Accepted = responder confirmed ownership.",
      trackAction: "Track Case",
    },
    unauthorized: {
      title: "Not Authorised",
      description:
        "Your account does not have permission to open this workspace. User and Admin portals are strictly separated.",
      backReport: "Go to SOS Report",
      backHome: "Back to Overview",
    },
  },
  auth: {
    signOut: "Sign Out",
    signingOut: "Signing out...",
    signOutError: "Could not sign out. Please try again.",
  },
  footer: {
    privacyLink: "Privacy",
    aboutLink: "About",
    copyright: "RAKSHAK Emergency Coordination",
  },
  pages: {
    privacy: {
      title: "Privacy & Data Handling",
      lead: "RAKSHAK collects only the details required to coordinate local help for your report.",
      points: [
        "Location coordinates or landmarks are shared only with verified responders matching your case category and area.",
        "Optional 10-second voice notes are stored in a private bucket and are never publicly listed.",
        "Reporter contact details remain hidden from responders until a responder explicitly accepts the case.",
        "Automated triage suggestions never receive personal names or phone numbers.",
      ],
    },
    about: {
      title: "About RAKSHAK",
      lead: "RAKSHAK is a location-based emergency reporting and coordination aid.",
      body: "It helps citizens share structured incident details with verified local medical, animal rescue, and fire teams while keeping status transitions transparent. RAKSHAK does not replace official emergency services — always dial 112, 108, or 101 in immediate danger.",
    },
    notFound: {
      title: "Page not found",
      description: "The page or case route you requested does not exist.",
      action: "Back to home",
    },
    error: {
      title: "Something went wrong",
      description:
        "We could not load this view right now. If this is an active emergency, call 112, 108, or 101 directly.",
      retry: "Try again",
    },
  },
} as const;
