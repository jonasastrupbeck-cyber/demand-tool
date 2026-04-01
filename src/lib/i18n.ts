export type Locale = 'en' | 'da' | 'sv' | 'de';

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  da: 'Dansk',
  sv: 'Svenska',
  de: 'Deutsch',
};

const translations = {
  // Landing page
  'app.title': {
    en: 'Demand Analysis',
    da: 'Eftersp\u00f8rgselsanalyse',
    sv: 'Efterfr\u00e5geanalys',
    de: 'Nachfrageanalyse',
  },
  'app.subtitle': {
    en: 'Vanguard Method demand gathering tool',
    da: 'V\u00e6rkt\u00f8j til indsamling af eftersp\u00f8rgsel efter Vanguard Metoden',
    sv: 'Verktyg f\u00f6r insamling av efterfr\u00e5gan enligt Vanguard-metoden',
    de: 'Werkzeug zur Nachfrageerfassung nach der Vanguard-Methode',
  },
  'landing.joinStudy': {
    en: 'Join a Study',
    da: 'Deltag i et studie',
    sv: 'G\u00e5 med i en studie',
    de: 'An Studie teilnehmen',
  },
  'landing.accessCode': {
    en: 'Access Code',
    da: 'Adgangskode',
    sv: '\u00c5tkomstkod',
    de: 'Zugangscode',
  },
  'landing.join': {
    en: 'Join Study',
    da: 'Deltag i studie',
    sv: 'G\u00e5 med i studie',
    de: 'Studie beitreten',
  },
  'landing.joining': {
    en: 'Joining...',
    da: 'Deltager...',
    sv: 'G\u00e5r med...',
    de: 'Beitritt...',
  },
  'landing.createNew': {
    en: 'Create a new study',
    da: 'Opret et nyt studie',
    sv: 'Skapa en ny studie',
    de: 'Neue Studie erstellen',
  },
  'landing.joinExisting': {
    en: 'Join an existing study',
    da: 'Deltag i et eksisterende studie',
    sv: 'G\u00e5 med i en befintlig studie',
    de: 'An bestehender Studie teilnehmen',
  },
  'landing.createStudy': {
    en: 'Create a Study',
    da: 'Opret et studie',
    sv: 'Skapa en studie',
    de: 'Studie erstellen',
  },
  'landing.contactMethodQuestion': {
    en: 'Which contact method are you studying?',
    da: 'Hvilken kontaktmetode studerer du?',
    sv: 'Vilken kontaktmetod studerar du?',
    de: 'Welche Kontaktmethode untersuchen Sie?',
  },
  'landing.contactPhone': {
    en: 'Phone',
    da: 'Telefon',
    sv: 'Telefon',
    de: 'Telefon',
  },
  'landing.contactMail': {
    en: 'Mail',
    da: 'Mail',
    sv: 'Mail',
    de: 'Mail',
  },
  'landing.contactFaceToFace': {
    en: 'Face2face',
    da: 'Personligt',
    sv: 'Personligt',
    de: 'Persönlich',
  },
  'landing.contactOther': {
    en: 'Other',
    da: 'Andet',
    sv: 'Annat',
    de: 'Andere',
  },
  'landing.contactOtherPlaceholder': {
    en: 'Enter contact method...',
    da: 'Indtast kontaktmetode...',
    sv: 'Ange kontaktmetod...',
    de: 'Kontaktmethode eingeben...',
  },
  'landing.contactNone': {
    en: 'All (no default)',
    da: 'Alle (ingen standard)',
    sv: 'Alla (ingen standard)',
    de: 'Alle (kein Standard)',
  },
  'landing.studyName': {
    en: 'Study Name',
    da: 'Studienavn',
    sv: 'Studienamn',
    de: 'Studienname',
  },
  'landing.studyNamePlaceholder': {
    en: 'e.g. Contact Centre Demand Study',
    da: 'f.eks. Kontaktcenter eftersp\u00f8rgselsstudie',
    sv: 't.ex. Kontaktcenter efterfr\u00e5gestudie',
    de: 'z.B. Kontaktcenter-Nachfragestudie',
  },
  'landing.description': {
    en: 'Description (optional)',
    da: 'Beskrivelse (valgfri)',
    sv: 'Beskrivning (valfri)',
    de: 'Beschreibung (optional)',
  },
  'landing.descriptionPlaceholder': {
    en: 'What are you studying?',
    da: 'Hvad studerer du?',
    sv: 'Vad studerar du?',
    de: 'Was untersuchen Sie?',
  },
  'landing.create': {
    en: 'Create Study',
    da: 'Opret studie',
    sv: 'Skapa studie',
    de: 'Studie erstellen',
  },
  'landing.creating': {
    en: 'Creating...',
    da: 'Opretter...',
    sv: 'Skapar...',
    de: 'Erstelle...',
  },
  'landing.notFound': {
    en: 'Study not found. Check your access code.',
    da: 'Studie ikke fundet. Tjek din adgangskode.',
    sv: 'Studien hittades inte. Kontrollera din \u00e5tkomstkod.',
    de: 'Studie nicht gefunden. \u00dcberpr\u00fcfen Sie Ihren Zugangscode.',
  },
  'landing.createFailed': {
    en: 'Failed to create study.',
    da: 'Kunne ikke oprette studie.',
    sv: 'Kunde inte skapa studie.',
    de: 'Studie konnte nicht erstellt werden.',
  },

  // Navigation
  'nav.capture': {
    en: 'Capture',
    da: 'Indsamling',
    sv: 'Insamling',
    de: 'Erfassung',
  },
  'nav.dashboard': {
    en: 'Dashboard',
    da: 'Dashboard',
    sv: 'Dashboard',
    de: 'Dashboard',
  },
  'nav.settings': {
    en: 'Settings',
    da: 'Indstillinger',
    sv: 'Inst\u00e4llningar',
    de: 'Einstellungen',
  },

  // Capture form
  'capture.today': {
    en: 'Today',
    da: 'I dag',
    sv: 'Idag',
    de: 'Heute',
  },
  'capture.verbatimLabel': {
    en: 'What did the customer say? (verbatim)',
    da: 'Hvad sagde kunden? (ordret)',
    sv: 'Vad sa kunden? (ordagrant)',
    de: 'Was hat der Kunde gesagt? (w\u00f6rtlich)',
  },
  'capture.verbatimPlaceholder': {
    en: "Write the customer's words exactly as they said them...",
    da: 'Skriv kundens ord pr\u00e6cis som de sagde dem...',
    sv: 'Skriv kundens ord exakt som de sa dem...',
    de: 'Schreiben Sie die Worte des Kunden genau so auf, wie sie gesagt wurden...',
  },
  'capture.classification': {
    en: 'Classification',
    da: 'Klassifikation',
    sv: 'Klassificering',
    de: 'Klassifizierung',
  },
  'capture.value': {
    en: 'Value',
    da: 'V\u00e6rdiskabende',
    sv: 'V\u00e4rdeskapande',
    de: 'Wert',
  },
  'capture.failure': {
    en: 'Failure',
    da: 'Ikke-v\u00e6rdiskabende',
    sv: 'Icke-v\u00e4rdeskapande',
    de: 'Fehler',
  },
  'capture.demandTypeLabel': {
    en: 'Type of {classification} demand',
    da: 'Type af {classification} eftersp\u00f8rgsel',
    sv: 'Typ av {classification} efterfr\u00e5gan',
    de: 'Art der {classification}-Nachfrage',
  },
  'capture.selectType': {
    en: 'Select type...',
    da: 'V\u00e6lg type...',
    sv: 'V\u00e4lj typ...',
    de: 'Typ ausw\u00e4hlen...',
  },
  'capture.handlingLabel': {
    en: 'Handling at point of transaction',
    da: 'H\u00e5ndtering ved transaktionspunktet',
    sv: 'Hantering vid transaktionspunkten',
    de: 'Bearbeitung am Transaktionspunkt',
  },
  'capture.selectHandling': {
    en: 'Select handling...',
    da: 'V\u00e6lg h\u00e5ndtering...',
    sv: 'V\u00e4lj hantering...',
    de: 'Bearbeitung ausw\u00e4hlen...',
  },
  'capture.originalValueDemandLabel': {
    en: 'What was the original value demand?',
    da: 'Hvad var den oprindelige værdiskabende efterspørgsel?',
    sv: 'Vad var den ursprungliga värdeskapande efterfrågan?',
    de: 'Was war die ursprüngliche Wertnachfrage?',
  },
  'capture.selectOriginalValueDemand': {
    en: 'Select original value demand...',
    da: 'Vælg oprindelig værdiskabende efterspørgsel...',
    sv: 'Välj ursprunglig värdeskapande efterfrågan...',
    de: 'Ursprüngliche Wertnachfrage auswählen...',
  },
  'capture.failureCauseLabel': {
    en: 'Cause of failure demand (system condition)',
    da: '\u00c5rsag til ikke-v\u00e6rdiskabende eftersp\u00f8rgsel (systemforhold)',
    sv: 'Orsak till icke-v\u00e4rdeskapande efterfr\u00e5gan (systemf\u00f6rh\u00e5llande)',
    de: 'Ursache der Fehlernachfrage (Systembedingung)',
  },
  'capture.failureCausePlaceholder': {
    en: 'What system condition caused this failure demand?',
    da: 'Hvilket systemforhold for\u00e5rsagede denne ikke-v\u00e6rdiskabende eftersp\u00f8rgsel?',
    sv: 'Vilket systemf\u00f6rh\u00e5llande orsakade denna icke-v\u00e4rdeskapande efterfr\u00e5gan?',
    de: 'Welche Systembedingung hat diese Fehlernachfrage verursacht?',
  },
  'capture.contactMethodLabel': {
    en: 'Contact method',
    da: 'Kontaktmetode',
    sv: 'Kontaktmetod',
    de: 'Kontaktmethode',
  },
  'capture.selectContactMethod': {
    en: 'Select contact method...',
    da: 'V\u00e6lg kontaktmetode...',
    sv: 'V\u00e4lj kontaktmetod...',
    de: 'Kontaktmethode ausw\u00e4hlen...',
  },
  'capture.whatMattersTypeLabel': {
    en: 'What matters category',
    da: 'Hvad betyder noget-kategori',
    sv: 'Vad \u00e4r viktigt-kategori',
    de: 'Was wichtig ist-Kategorie',
  },
  'capture.selectWhatMattersType': {
    en: 'Select category...',
    da: 'V\u00e6lg kategori...',
    sv: 'V\u00e4lj kategori...',
    de: 'Kategorie ausw\u00e4hlen...',
  },
  'capture.whatMattersLabel': {
    en: 'What matters to the customer? (notes)',
    da: 'Hvad betyder noget for kunden? (noter)',
    sv: 'Vad \u00e4r viktigt f\u00f6r kunden? (anteckningar)',
    de: 'Was ist dem Kunden wichtig? (Notizen)',
  },
  'capture.whatMattersPlaceholder': {
    en: 'What does the customer really care about?',
    da: 'Hvad er kunden virkelig optaget af?',
    sv: 'Vad bryr sig kunden verkligen om?',
    de: 'Was ist dem Kunden wirklich wichtig?',
  },
  'capture.save': {
    en: 'Save Demand Entry',
    da: 'Gem eftersp\u00f8rgselsregistrering',
    sv: 'Spara efterfr\u00e5gepost',
    de: 'Nachfrageeintrag speichern',
  },
  'capture.saving': {
    en: 'Saving...',
    da: 'Gemmer...',
    sv: 'Sparar...',
    de: 'Speichere...',
  },
  'capture.saved': {
    en: 'Entry saved successfully',
    da: 'Registrering gemt',
    sv: 'Post sparad',
    de: 'Eintrag gespeichert',
  },
  'capture.saveFailed': {
    en: 'Failed to save entry. Please try again.',
    da: 'Kunne ikke gemme registrering. Pr\u00f8v igen.',
    sv: 'Kunde inte spara post. F\u00f6rs\u00f6k igen.',
    de: 'Eintrag konnte nicht gespeichert werden. Bitte versuchen Sie es erneut.',
  },
  'capture.loading': {
    en: 'Loading...',
    da: 'Indl\u00e6ser...',
    sv: 'Laddar...',
    de: 'Laden...',
  },
  'capture.studyNotFound': {
    en: 'Study not found',
    da: 'Studie ikke fundet',
    sv: 'Studie hittades inte',
    de: 'Studie nicht gefunden',
  },

  // Settings
  'settings.title': {
    en: 'Study Settings',
    da: 'Studieindstillinger',
    sv: 'Studieinst\u00e4llningar',
    de: 'Studieneinstellungen',
  },
  'settings.accessCode': {
    en: 'Access Code',
    da: 'Adgangskode',
    sv: '\u00c5tkomstkod',
    de: 'Zugangscode',
  },
  'settings.shareCode': {
    en: 'Share this code with your team to join the study.',
    da: 'Del denne kode med dit team for at deltage i studiet.',
    sv: 'Dela denna kod med ditt team f\u00f6r att g\u00e5 med i studien.',
    de: 'Teilen Sie diesen Code mit Ihrem Team, um an der Studie teilzunehmen.',
  },
  'settings.copy': {
    en: 'Copy',
    da: 'Kopier',
    sv: 'Kopiera',
    de: 'Kopieren',
  },
  'settings.copied': {
    en: 'Copied!',
    da: 'Kopieret!',
    sv: 'Kopierad!',
    de: 'Kopiert!',
  },
  'settings.handlingTypes': {
    en: 'Handling Types',
    da: 'H\u00e5ndteringstyper',
    sv: 'Hanteringstyper',
    de: 'Bearbeitungsarten',
  },
  'settings.handlingDesc': {
    en: 'How demand is handled at the point of transaction. Mark one as "one-stop" for the Perfect metric.',
    da: 'Hvordan eftersp\u00f8rgsel h\u00e5ndteres ved transaktionspunktet. Mark\u00e9r \u00e9n som "one-stop" for Perfect-m\u00e5lingen.',
    sv: 'Hur efterfr\u00e5gan hanteras vid transaktionspunkten. Markera en som "one-stop" f\u00f6r Perfect-m\u00e5ttet.',
    de: 'Wie Nachfrage am Transaktionspunkt bearbeitet wird. Markieren Sie eine als "One-Stop" f\u00fcr die Perfect-Metrik.',
  },
  'settings.oneStop': {
    en: 'one-stop',
    da: 'one-stop',
    sv: 'one-stop',
    de: 'One-Stop',
  },
  'settings.setOneStop': {
    en: 'Set as one-stop',
    da: 'Angiv som one-stop',
    sv: 'Ange som one-stop',
    de: 'Als One-Stop festlegen',
  },
  'settings.remove': {
    en: 'Remove',
    da: 'Fjern',
    sv: 'Ta bort',
    de: 'Entfernen',
  },
  'settings.add': {
    en: 'Add',
    da: 'Tilf\u00f8j',
    sv: 'L\u00e4gg till',
    de: 'Hinzuf\u00fcgen',
  },
  'settings.addHandling': {
    en: 'Add handling type...',
    da: 'Tilf\u00f8j h\u00e5ndteringstype...',
    sv: 'L\u00e4gg till hanteringstyp...',
    de: 'Bearbeitungsart hinzuf\u00fcgen...',
  },
  'settings.valueDemandTypes': {
    en: 'Value Demand Types',
    da: 'Typer af v\u00e6rdiskabende eftersp\u00f8rgsel',
    sv: 'Typer av v\u00e4rdeskapande efterfr\u00e5gan',
    de: 'Wert-Nachfragearten',
  },
  'settings.valueDesc': {
    en: 'Categories for demand the organisation exists to serve.',
    da: 'Kategorier for den eftersp\u00f8rgsel organisationen eksisterer for at betjene.',
    sv: 'Kategorier f\u00f6r den efterfr\u00e5gan organisationen finns till f\u00f6r att betj\u00e4na.',
    de: 'Kategorien f\u00fcr Nachfrage, f\u00fcr die die Organisation existiert.',
  },
  'settings.addValueType': {
    en: 'Add value demand type...',
    da: 'Tilf\u00f8j type af v\u00e6rdiskabende eftersp\u00f8rgsel...',
    sv: 'L\u00e4gg till typ av v\u00e4rdeskapande efterfr\u00e5gan...',
    de: 'Wert-Nachfrageart hinzuf\u00fcgen...',
  },
  'settings.failureDemandTypes': {
    en: 'Failure Demand Types',
    da: 'Typer af ikke-v\u00e6rdiskabende eftersp\u00f8rgsel',
    sv: 'Typer av icke-v\u00e4rdeskapande efterfr\u00e5gan',
    de: 'Fehler-Nachfragearten',
  },
  'settings.failureDesc': {
    en: 'Categories for demand caused by not doing something right.',
    da: 'Kategorier for eftersp\u00f8rgsel for\u00e5rsaget af ikke at g\u00f8re noget rigtigt.',
    sv: 'Kategorier f\u00f6r efterfr\u00e5gan orsakad av att inte g\u00f6ra n\u00e5got r\u00e4tt.',
    de: 'Kategorien f\u00fcr Nachfrage, die dadurch entsteht, dass etwas nicht richtig gemacht wurde.',
  },
  'settings.addFailureType': {
    en: 'Add failure demand type...',
    da: 'Tilf\u00f8j type af ikke-v\u00e6rdiskabende eftersp\u00f8rgsel...',
    sv: 'L\u00e4gg till typ av icke-v\u00e4rdeskapande efterfr\u00e5gan...',
    de: 'Fehler-Nachfrageart hinzuf\u00fcgen...',
  },
  'settings.contactMethods': {
    en: 'Contact Methods',
    da: 'Kontaktmetoder',
    sv: 'Kontaktmetoder',
    de: 'Kontaktmethoden',
  },
  'settings.contactMethodsDesc': {
    en: 'How customers contact the organisation.',
    da: 'Hvordan kunder kontakter organisationen.',
    sv: 'Hur kunder kontaktar organisationen.',
    de: 'Wie Kunden die Organisation kontaktieren.',
  },
  'settings.addContactMethod': {
    en: 'Add contact method...',
    da: 'Tilf\u00f8j kontaktmetode...',
    sv: 'L\u00e4gg till kontaktmetod...',
    de: 'Kontaktmethode hinzuf\u00fcgen...',
  },
  'settings.whatMattersTypes': {
    en: 'What Matters Categories',
    da: 'Hvad betyder noget-kategorier',
    sv: 'Vad \u00e4r viktigt-kategorier',
    de: 'Was wichtig ist-Kategorien',
  },
  'settings.whatMattersTypesDesc': {
    en: 'Categories for what matters to the customer. Used for quantitative dashboard analysis.',
    da: 'Kategorier for hvad der betyder noget for kunden. Bruges til kvantitativ dashboard-analyse.',
    sv: 'Kategorier f\u00f6r vad som \u00e4r viktigt f\u00f6r kunden. Anv\u00e4nds f\u00f6r kvantitativ dashboard-analys.',
    de: 'Kategorien f\u00fcr das, was dem Kunden wichtig ist. Wird f\u00fcr die quantitative Dashboard-Analyse verwendet.',
  },
  'settings.addWhatMattersType': {
    en: 'Add category...',
    da: 'Tilf\u00f8j kategori...',
    sv: 'L\u00e4gg till kategori...',
    de: 'Kategorie hinzuf\u00fcgen...',
  },
  'settings.language': {
    en: 'Language',
    da: 'Sprog',
    sv: 'Spr\u00e5k',
    de: 'Sprache',
  },

  // Dashboard
  'dashboard.title': {
    en: 'Demand Analysis',
    da: 'Efterspørgselsanalyse',
    sv: 'Efterfrågeanalys',
    de: 'Nachfrageanalyse',
  },
  'dashboard.loading': {
    en: 'Loading dashboard...',
    da: 'Indl\u00e6ser dashboard...',
    sv: 'Laddar dashboard...',
    de: 'Dashboard wird geladen...',
  },
  'dashboard.loadFailed': {
    en: 'Failed to load dashboard',
    da: 'Kunne ikke indl\u00e6se dashboard',
    sv: 'Kunde inte ladda dashboard',
    de: 'Dashboard konnte nicht geladen werden',
  },
  'dashboard.allTime': {
    en: 'All time',
    da: 'Altid',
    sv: 'Hela perioden',
    de: 'Gesamtzeitraum',
  },
  'dashboard.today': {
    en: 'Today',
    da: 'I dag',
    sv: 'Idag',
    de: 'Heute',
  },
  'dashboard.7days': {
    en: '7 days',
    da: '7 dage',
    sv: '7 dagar',
    de: '7 Tage',
  },
  'dashboard.30days': {
    en: '30 days',
    da: '30 dage',
    sv: '30 dagar',
    de: '30 Tage',
  },
  'dashboard.export': {
    en: 'Export XLSX',
    da: 'Eksporter XLSX',
    sv: 'Exportera XLSX',
    de: 'XLSX exportieren',
  },
  'dashboard.exportPptx': {
    en: 'Export PPTX',
    da: 'Eksporter PPTX',
    sv: 'Exportera PPTX',
    de: 'PPTX exportieren',
  },
  'dashboard.totalEntries': {
    en: 'Total Entries',
    da: 'Antal registreringer',
    sv: 'Totalt antal poster',
    de: 'Eintr\u00e4ge gesamt',
  },
  'dashboard.valueDemand': {
    en: 'Value Demand',
    da: 'V\u00e6rdiskabende eftersp\u00f8rgsel',
    sv: 'V\u00e4rdeskapande efterfr\u00e5gan',
    de: 'Wert-Nachfrage',
  },
  'dashboard.failureDemand': {
    en: 'Failure Demand',
    da: 'Ikke-v\u00e6rdiskabende eftersp\u00f8rgsel',
    sv: 'Icke-v\u00e4rdeskapande efterfr\u00e5gan',
    de: 'Fehler-Nachfrage',
  },
  'dashboard.perfect': {
    en: 'Perfect?',
    da: 'Perfekt?',
    sv: 'Perfekt?',
    de: 'Perfekt?',
  },
  'dashboard.perfectSub': {
    en: 'value + one-stop / total',
    da: 'v\u00e6rdiskabende + one-stop / total',
    sv: 'v\u00e4rdeskapande + one-stop / totalt',
    de: 'Wert + One-Stop / gesamt',
  },
  'dashboard.entries': {
    en: 'entries',
    da: 'registreringer',
    sv: 'poster',
    de: 'Eintr\u00e4ge',
  },
  'dashboard.noEntries': {
    en: 'No entries yet. Start capturing demand to see analytics.',
    da: 'Ingen registreringer endnu. Begynd at indsamle eftersp\u00f8rgsel for at se analyser.',
    sv: 'Inga poster \u00e4nnu. B\u00f6rja samla in efterfr\u00e5gan f\u00f6r att se analyser.',
    de: 'Noch keine Eintr\u00e4ge. Beginnen Sie mit der Nachfrageerfassung, um Analysen zu sehen.',
  },
  'dashboard.valueVsFailure': {
    en: 'Value vs Failure Demand',
    da: 'V\u00e6rdiskabende vs. ikke-v\u00e6rdiskabende eftersp\u00f8rgsel',
    sv: 'V\u00e4rdeskapande vs. icke-v\u00e4rdeskapande efterfr\u00e5gan',
    de: 'Wert- vs. Fehler-Nachfrage',
  },
  'dashboard.top10': {
    en: 'Top 10 Demand Types',
    da: 'Top 10 eftersp\u00f8rgselstyper',
    sv: 'Topp 10 efterfr\u00e5getyper',
    de: 'Top 10 Nachfragearten',
  },
  'dashboard.handlingTitle': {
    en: 'Handling at Point of Transaction',
    da: 'H\u00e5ndtering ved transaktionspunktet',
    sv: 'Hantering vid transaktionspunkten',
    de: 'Bearbeitung am Transaktionspunkt',
  },
  'dashboard.handlingByClass': {
    en: 'Handling: Value vs Failure',
    da: 'H\u00e5ndtering: V\u00e6rdiskabende vs. ikke-v\u00e6rdiskabende',
    sv: 'Hantering: V\u00e4rdeskapande vs. icke-v\u00e4rdeskapande',
    de: 'Bearbeitung: Wert vs. Fehler',
  },
  'dashboard.contactMethods': {
    en: 'Contact Methods',
    da: 'Kontaktmetoder',
    sv: 'Kontaktmetoder',
    de: 'Kontaktmethoden',
  },
  'dashboard.overTime': {
    en: 'Demand Over Time',
    da: 'Eftersp\u00f8rgsel over tid',
    sv: 'Efterfr\u00e5gan \u00f6ver tid',
    de: 'Nachfrage im Zeitverlauf',
  },
  'dashboard.failuresByOriginalValue': {
    en: 'Failure Demand by Original Value Demand',
    da: 'Ikke-værdiskabende efterspørgsel fordelt på oprindelig værdiskabende efterspørgsel',
    sv: 'Icke-värdeskapande efterfrågan per ursprunglig värdeskapande efterfrågan',
    de: 'Fehlernachfrage nach ursprünglicher Wertnachfrage',
  },
  'dashboard.failureByValueTitle': {
    en: 'What type of value demand causes us most failure demand?',
    da: 'Hvilken type værdiskabende efterspørgsel forårsager mest ikke-værdiskabende efterspørgsel?',
    sv: 'Vilken typ av värdeskapande efterfrågan orsakar mest icke-värdeskapande efterfrågan?',
    de: 'Welche Art von Wertnachfrage verursacht die meiste Fehlernachfrage?',
  },
  'dashboard.failureCauses': {
    en: 'Failure Causes (System Conditions)',
    da: '\u00c5rsager til ikke-v\u00e6rdiskabende eftersp\u00f8rgsel (systemforhold)',
    sv: 'Orsaker till icke-v\u00e4rdeskapande efterfr\u00e5gan (systemf\u00f6rh\u00e5llanden)',
    de: 'Fehlerursachen (Systembedingungen)',
  },
  'dashboard.whatMatters': {
    en: 'What Matters to the Customer',
    da: 'Hvad betyder noget for kunden',
    sv: 'Vad \u00e4r viktigt f\u00f6r kunden',
    de: 'Was dem Kunden wichtig ist',
  },
  'dashboard.whatMattersNotes': {
    en: 'What Matters — Customer Notes',
    da: 'Hvad betyder noget — Kundenoter',
    sv: 'Vad är viktigt — Kundanteckningar',
    de: 'Was wichtig ist — Kundennotizen',
  },
  'dashboard.valueConcentration': {
    en: 'Value Demand Concentration',
    da: 'Koncentration af v\u00e6rdiskabende eftersp\u00f8rgsel',
    sv: 'Koncentration av v\u00e4rdeskapande efterfr\u00e5gan',
    de: 'Wert-Nachfragekonzentration',
  },
  'dashboard.concentrationText': {
    en: 'of value demand falls into the top 5 types.',
    da: 'af den v\u00e6rdiskabende eftersp\u00f8rgsel falder i de top 5 typer.',
    sv: 'av den v\u00e4rdeskapande efterfr\u00e5gan faller i topp 5-typerna.',
    de: 'der Wert-Nachfrage entf\u00e4llt auf die Top-5-Arten.',
  },
  'dashboard.highConcentration': {
    en: 'High concentration \u2014 the system could be designed around a small number of predictable demands.',
    da: 'H\u00f8j koncentration \u2014 systemet kan designes omkring et lille antal forudsigelige eftersp\u00f8rgsler.',
    sv: 'H\u00f6g koncentration \u2014 systemet kan designas kring ett litet antal f\u00f6ruts\u00e4gbara efterfr\u00e5gningar.',
    de: 'Hohe Konzentration \u2014 das System k\u00f6nnte um eine kleine Anzahl vorhersehbarer Nachfragen gestaltet werden.',
  },
  'dashboard.uploadXlsx': {
    en: 'Upload XLSX',
    da: 'Upload XLSX',
    sv: 'Ladda upp XLSX',
    de: 'XLSX hochladen',
  },
  'dashboard.downloadTemplate': {
    en: 'Download Template',
    da: 'Download skabelon',
    sv: 'Ladda ner mall',
    de: 'Vorlage herunterladen',
  },
  'dashboard.uploadSuccess': {
    en: 'Successfully imported {count} entries',
    da: '{count} registreringer importeret',
    sv: '{count} poster importerade',
    de: '{count} Eintr\u00e4ge erfolgreich importiert',
  },
  'dashboard.uploadError': {
    en: 'Upload failed: {error}',
    da: 'Upload fejlede: {error}',
    sv: 'Uppladdning misslyckades: {error}',
    de: 'Upload fehlgeschlagen: {error}',
  },
  'dashboard.uploading': {
    en: 'Uploading...',
    da: 'Uploader...',
    sv: 'Laddar upp...',
    de: 'Hochladen...',
  },
  'dashboard.pointOfTransaction': {
    en: 'Demand by Point of Transaction',
    da: 'Efterspørgsel fordelt på transaktionspunkt',
    sv: 'Efterfrågan per transaktionspunkt',
    de: 'Nachfrage nach Transaktionspunkt',
  },
  'landing.pointOfTransactionQuestion': {
    en: 'What is the point of transaction?',
    da: 'Hvad er transaktionspunktet?',
    sv: 'Vad är transaktionspunkten?',
    de: 'Was ist der Transaktionspunkt?',
  },
  'landing.pointOfTransactionPlaceholder': {
    en: 'e.g. Customer service, 2nd line support...',
    da: 'f.eks. Kundeservice, 2. linje support...',
    sv: 't.ex. Kundtjänst, 2:a linjens support...',
    de: 'z.B. Kundenservice, 2nd-Level-Support...',
  },
  'capture.pointOfTransactionLabel': {
    en: 'Point of transaction',
    da: 'Transaktionspunkt',
    sv: 'Transaktionspunkt',
    de: 'Transaktionspunkt',
  },
  'capture.selectPointOfTransaction': {
    en: 'Select point of transaction...',
    da: 'Vælg transaktionspunkt...',
    sv: 'Välj transaktionspunkt...',
    de: 'Transaktionspunkt auswählen...',
  },
  'settings.pointsOfTransaction': {
    en: 'Points of Transaction',
    da: 'Transaktionspunkter',
    sv: 'Transaktionspunkter',
    de: 'Transaktionspunkte',
  },
  'settings.pointsOfTransactionDesc': {
    en: 'Where demand is received in the organisation.',
    da: 'Hvor efterspørgslen modtages i organisationen.',
    sv: 'Var efterfrågan tas emot i organisationen.',
    de: 'Wo die Nachfrage in der Organisation empfangen wird.',
  },
  'settings.addPointOfTransaction': {
    en: 'Add point of transaction...',
    da: 'Tilføj transaktionspunkt...',
    sv: 'Lägg till transaktionspunkt...',
    de: 'Transaktionspunkt hinzufügen...',
  },
} as const;

export type TranslationKey = keyof typeof translations;

export function t(key: TranslationKey, locale: Locale, params?: Record<string, string>): string {
  const entry = translations[key];
  let text: string = entry?.[locale] || entry?.['en'] || key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(`{${k}}`, v);
    }
  }
  return text;
}

// Known default labels with translations across all languages.
// Each inner array contains [en, da, sv, de] variants of the same label.
const DEFAULT_LABEL_GROUPS: string[][] = [
  // Handling types
  ['One Stop', 'One Stop', 'One Stop', 'One Stop'],
  ['Pass-on', 'Sendt videre', 'Skickat vidare', 'Weitergeleitet'],
  ['Pass-back', 'Sendt tilbage', 'Skickat tillbaka', 'Zurückgeleitet'],
  // Legacy handling types (from older studies)
  ['Resolved at first contact', 'Løst ved første kontakt', 'Löst vid första kontakt', 'Beim ersten Kontakt gelöst'],
  ['Transferred to another team', 'Overført til et andet team', 'Överfört till ett annat team', 'An anderes Team weitergeleitet'],
  ['Callback required', 'Tilbagekald påkrævet', 'Återuppringning krävs', 'Rückruf erforderlich'],
  ['Escalated', 'Eskaleret', 'Eskalerat', 'Eskaliert'],
  ['Information provided', 'Information givet', 'Information given', 'Information bereitgestellt'],
  // Contact methods
  ['Phone', 'Telefon', 'Telefon', 'Telefon'],
  ['Mail', 'Mail', 'Mail', 'Mail'],
  ['Face2face', 'Personligt', 'Personligt', 'Persönlich'],
  // Value demand types
  ['Request for information', 'Forespørgsel om information', 'Förfrågan om information', 'Informationsanfrage'],
  ['Request for service', 'Forespørgsel om service', 'Förfrågan om tjänst', 'Serviceanfrage'],
  ['New application/order', 'Ny ansøgning/ordre', 'Ny ansökan/beställning', 'Neuer Antrag/Bestellung'],
  // Failure demand types
  ['Chasing progress', 'Rykning for status', 'Följa upp ärende', 'Nachfrage zum Status'],
  ['Complaint', 'Klage', 'Klagomål', 'Beschwerde'],
  ['Error/mistake correction', 'Fejlrettelse', 'Felkorrigering', 'Fehlerkorrektur'],
  ['Repeat contact', 'Gentagen henvendelse', 'Upprepat kontakt', 'Wiederholter Kontakt'],
];

const LOCALE_INDEX: Record<Locale, number> = { en: 0, da: 1, sv: 2, de: 3 };

// Build lookup: for any known label in any language, find its group
const labelGroupMap = new Map<string, string[]>();
for (const group of DEFAULT_LABEL_GROUPS) {
  for (const label of group) {
    labelGroupMap.set(label.toLowerCase(), group);
  }
}

/**
 * Translate a known default label to the target locale.
 * Returns the original label if it's not a known default.
 */
export function translateLabel(label: string, locale: Locale): string {
  const group = labelGroupMap.get(label.toLowerCase());
  if (!group) return label;
  return group[LOCALE_INDEX[locale]];
}
