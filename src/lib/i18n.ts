export type Locale = 'en' | 'da' | 'sv' | 'de';

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  da: 'Dansk',
  sv: 'Svenska',
  de: 'Deutsch',
};

const translations = {
  // Landing page
  // Newlines are intentional: the landing renders this stacked over three lines
  // (whitespace-pre-line). The browser tab title is a separate single-line
  // string in layout.tsx, so it is unaffected.
  'app.title': {
    en: 'Understanding\nyour organisation\nfrom the outside in',
    da: 'Forst\u00e5\ndin organisation\nudefra og ind',
    sv: 'F\u00f6rst\u00e5\ndin organisation\nutifr\u00e5n och in',
    de: 'Verstehen Sie Ihre\nOrganisation\nvon au\u00dfen nach innen',
  },
  'app.subtitle': {
    en: 'Data Gathering Powered by the Vanguard Method',
    da: 'Dataindsamling drevet af Vanguard-metoden',
    sv: 'Datainsamling med Vanguard-metoden',
    de: 'Datenerfassung mit der Vanguard-Methode',
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
  'landing.consultantAccess': {
    en: 'Consultant access',
    da: 'Konsulentadgang',
    sv: 'Konsultåtkomst',
    de: 'Beraterzugang',
  },
  'landing.consultantAccessHint': {
    en: 'Creating a study is for consultants. Enter your consultant code to continue.',
    da: 'Oprettelse af et studie er for konsulenter. Indtast din konsulentkode for at fortsætte.',
    sv: 'Att skapa en studie är för konsulter. Ange din konsultkod för att fortsätta.',
    de: 'Das Erstellen einer Studie ist Beratern vorbehalten. Geben Sie Ihren Beratercode ein, um fortzufahren.',
  },
  'landing.adminCode': {
    en: 'Consultant code',
    da: 'Konsulentkode',
    sv: 'Konsultkod',
    de: 'Beratercode',
  },
  'landing.adminCodePlaceholder': {
    en: 'Enter consultant code',
    da: 'Indtast konsulentkode',
    sv: 'Ange konsultkod',
    de: 'Beratercode eingeben',
  },
  'landing.unlock': {
    en: 'Unlock',
    da: 'Lås op',
    sv: 'Lås upp',
    de: 'Entsperren',
  },
  'landing.unlocking': {
    en: 'Unlocking…',
    da: 'Låser op…',
    sv: 'Låser upp…',
    de: 'Entsperren…',
  },
  'landing.adminCodeInvalid': {
    en: 'Incorrect consultant code',
    da: 'Forkert konsulentkode',
    sv: 'Felaktig konsultkod',
    de: 'Falscher Beratercode',
  },
  'landing.methodContext': {
    en: 'Study your service from your customers’ perspective — to understand how the system really performs and where to improve.',
    da: 'Studér din service udefra og ind — for at forstå hvordan systemet faktisk præsterer, og hvor det kan forbedres.',
    sv: 'Studera din tjänst utifrån och in — för att förstå hur systemet faktiskt fungerar och var det kan förbättras.',
    de: 'Betrachten Sie Ihren Service von außen nach innen — um zu verstehen, wie das System wirklich funktioniert und wo es sich verbessern lässt.',
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
  'capture.classificationWorkValue': {
    en: 'Value',
    da: 'V\u00e6rdiskabende',
    sv: 'V\u00e4rdeskapande',
    de: 'Wert',
  },
  'capture.classificationWorkFailure': {
    en: 'Failure',
    da: 'Ikke-v\u00e6rdiskabende',
    sv: 'Icke-v\u00e4rdeskapande',
    de: 'Fehler',
  },
  'capture.classificationWorkSequence': {
    en: 'Sequence',
    da: 'Sekvensarbejde',
    sv: 'Sekvensarbete',
    de: 'Sequenzarbeit',
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
  // 'Capability of response' is the canonical EN term. Earlier da/sv/de
  // translations said 'Handling at the transaction point' — a different concept.
  // Aligned to the capability-of-response translations already used in the
  // addHandlingButton / strand labels.
  'capture.handlingLabel': {
    en: 'Capability of response',
    da: 'Reaktionskapacitet',
    sv: 'Reaktionsförmåga',
    de: 'Reaktionsfähigkeit',
  },
  'capture.selectHandling': {
    en: 'Select capability of response...',
    da: 'V\u00e6lg reaktionskapacitet...',
    sv: 'V\u00e4lj reaktionsf\u00f6rm\u00e5ga...',
    de: 'Reaktionsf\u00e4higkeit ausw\u00e4hlen...',
  },
  'capture.capabilityNoDefinition': {
    en: 'No definition yet — add one in Settings.',
    da: 'Ingen definition endnu — tilf\u00f8j en i indstillinger.',
    sv: 'Ingen definition \u00e4nnu — l\u00e4gg till en i inst\u00e4llningar.',
    de: 'Noch keine Definition — in Einstellungen hinzuf\u00fcgen.',
  },
  'capture.capabilityExampleHeader': {
    en: 'Example demand',
    da: 'Eksempel p\u00e5 eftersp\u00f8rgsel',
    sv: 'Exempel p\u00e5 efterfr\u00e5gan',
    de: 'Beispielnachfrage',
  },
  'capture.capabilityNoExample': {
    en: 'No example yet.',
    da: 'Ingen eksempler endnu.',
    sv: 'Inga exempel \u00e4nnu.',
    de: 'Noch kein Beispiel.',
  },
  'capture.originalValueDemandLabel': {
    en: 'What was the original value demand?',
    da: 'Hvad var den oprindelige værdiskabende efterspørgsel?',
    sv: 'Vad var den ursprungliga värdeskapande efterfrågan?',
    de: 'Was war die ursprüngliche Wertnachfrage?',
  },
  'capture.selectOriginalValueDemand': {
    en: 'Original value demand',
    da: 'Oprindelig værdiskabende efterspørgsel',
    sv: 'Ursprunglig värdeskapande efterfrågan',
    de: 'Ursprüngliche Wertnachfrage',
  },
  'capture.failureCauseLabel': {
    en: 'Cause of failure demand (system condition)',
    da: '\u00c5rsag til ikke-v\u00e6rdiskabende eftersp\u00f8rgsel (systemforhold)',
    sv: 'Orsak till icke-v\u00e4rdeskapande efterfr\u00e5gan (systemf\u00f6rh\u00e5llande)',
    de: 'Ursache der Fehlernachfrage (Systembedingung)',
  },
  'capture.systemConditionsLabel': {
    en: "What helped or hindered delivering the customer's purpose?",
    da: 'Hvad hjalp eller hindrede leveringen af kundens formål?',
    sv: 'Vad hjälpte eller hindrade leveransen av kundens syfte?',
    de: 'Was half oder hinderte die Erfüllung des Kundenzwecks?',
  },
  // Chips shown on each SC card indicating which of the five capture fields
  // the SC attaches to. User toggles these on/off. Per Ali 2026-04-16.
  'capture.scAttachHint': {
    en: 'Attach this system condition to:',
    da: 'Knyt dette systemforhold til:',
    sv: 'Koppla detta systemvillkor till:',
    de: 'Diese Systembedingung anhängen an:',
  },
  'capture.scAttachLifeProblem': {
    en: 'Life problem',
    da: 'Livsproblem',
    sv: 'Livsproblem',
    de: 'Lebensproblem',
  },
  'capture.scAttachDemand': {
    en: 'Demand',
    da: 'Efterspørgsel',
    sv: 'Efterfrågan',
    de: 'Nachfrage',
  },
  'capture.scAttachWhatMatters': {
    en: 'What matters',
    da: 'Hvad betyder noget',
    sv: 'Vad som spelar roll',
    de: 'Was wichtig ist',
  },
  'capture.scAttachCor': {
    en: 'CoR',
    da: 'CoR',
    sv: 'CoR',
    de: 'CoR',
  },
  'capture.scAttachWork': {
    en: 'Work',
    da: 'Arbejde',
    sv: 'Arbete',
    de: 'Arbeit',
  },
  'capture.thinkingLabel': {
    en: 'What was the thinking causing the system condition(s)?',
    da: 'Hvilken t\u00e6nkning for\u00e5rsagede disse systemforhold?',
    sv: 'Vilket t\u00e4nkande orsakade systemf\u00f6rh\u00e5llande(n)?',
    de: 'Welches Denken hat die Systembedingung(en) verursacht?',
  },
  'capture.addThinking': {
    en: 'Add thinking',
    da: 'Tilf\u00f8j t\u00e6nkning',
    sv: 'L\u00e4gg till t\u00e4nkande',
    de: 'Denken hinzuf\u00fcgen',
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
    en: 'Contact method',
    da: 'Kontaktmetode',
    sv: 'Kontaktmetod',
    de: 'Kontaktmethode',
  },
  'capture.sessionContext': {
    en: 'Session context (applies to every entry)',
    da: 'Sessionskontekst (g\u00e6lder for alle registreringer)',
    sv: 'Sessionskontext (g\u00e4ller alla poster)',
    de: 'Sitzungskontext (gilt f\u00fcr jeden Eintrag)',
  },
  'capture.sessionPointOfTransactionLabel': {
    en: 'Point of transaction',
    da: 'Transaktionspunkt',
    sv: 'Transaktionspunkt',
    de: 'Transaktionspunkt',
  },
  'capture.sessionWorkSourceLabel': {
    en: 'Work source',
    da: 'Arbejdskilde',
    sv: 'Arbetskälla',
    de: 'Arbeitsquelle',
  },
  'capture.sessionContactMethodLabel': {
    en: 'Contact method',
    da: 'Kontaktmetode',
    sv: 'Kontaktmetod',
    de: 'Kontaktmethode',
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
  // Canonical Vanguard phrasing (Jonas, 2026-06-12): "What matters to the
  // customer?" — DA/SV mirror the vault's "vigtigt for kunden" construction.
  'capture.whatMattersPlaceholder': {
    en: 'What matters to the customer?',
    da: 'Hvad er vigtigt for kunden?',
    sv: 'Vad är viktigt för kunden?',
    de: 'Was ist für den Kunden wichtig?',
  },
  'capture.addNote': {
    en: '+ Add note',
    da: '+ Tilf\u00f8j note',
    sv: '+ L\u00e4gg till anteckning',
    de: '+ Notiz hinzuf\u00fcgen',
  },
  'capture.hideNote': {
    en: 'Hide note',
    da: 'Skjul note',
    sv: 'D\u00f6lj anteckning',
    de: 'Notiz ausblenden',
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
  'capture.lastEntry': {
    en: 'Last entry',
    da: 'Seneste registrering',
    sv: 'Senaste post',
    de: 'Letzter Eintrag',
  },
  'capture.undo': {
    en: 'Undo',
    da: 'Fortryd',
    sv: 'Ångra',
    de: 'Rückgängig',
  },
  // Regret = abandon the entry being typed (kept distinct from Undo's "Fortryd"/
  // "Ångra" since both can be visible at once).
  'capture.regret': {
    en: 'Regret',
    da: 'Ryd',
    sv: 'Rensa',
    de: 'Verwerfen',
  },
  'capture.deleteTouch': {
    en: 'Delete',
    da: 'Slet',
    sv: 'Radera',
    de: 'Löschen',
  },
  'capture.deleteTouchConfirm': {
    en: 'Delete — sure?',
    da: 'Slet — sikker?',
    sv: 'Radera — säker?',
    de: 'Löschen — sicher?',
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
  'settings.purpose': {
    en: 'Purpose',
    da: 'Formål',
    sv: 'Syfte',
    de: 'Zweck',
  },
  'settings.purposeDesc': {
    en: 'What is the purpose of this system from the customer\'s point of view?',
    da: 'Hvad er formålet med dette system set fra kundens synspunkt?',
    sv: 'Vad är syftet med detta system ur kundens synvinkel?',
    de: 'Was ist der Zweck dieses Systems aus Sicht des Kunden?',
  },
  'settings.purposePlaceholder': {
    en: 'e.g. "To help customers resolve their issue in one contact"',
    da: 'f.eks. "At hjælpe kunder med at løse deres problem i én kontakt"',
    sv: 't.ex. "Att hjälpa kunder lösa sitt ärende vid en kontakt"',
    de: 'z.B. "Kunden helfen, ihr Anliegen in einem Kontakt zu lösen"',
  },
  'settings.accessCode': {
    en: 'Access Code',
    da: 'Adgangskode',
    sv: 'Åtkomstkod',
    de: 'Zugangscode',
  },
  'settings.formPreview': {
    en: 'Capture form preview',
    da: 'Registreringsformular forhåndsvisning',
    sv: 'Förhandsgranskning av registreringsformulär',
    de: 'Vorschau des Erfassungsformulars',
  },
  'settings.formPreviewDesc': {
    en: 'This is what practitioners will see when capturing demand.',
    da: 'Sådan ser det ud for medarbejderne, når de registrerer efterspørgsel.',
    sv: 'Så här ser det ut för medarbetarna när de registrerar efterfrågan.',
    de: 'So sieht es für die Mitarbeiter aus, wenn sie Nachfrage erfassen.',
  },
  'settings.shareCode': {
    en: 'Share this code with your team to join the study.',
    da: 'Del denne kode med dit team for at deltage i studiet.',
    sv: 'Dela denna kod med ditt team för att gå med i studien.',
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
    en: 'Capability of Response',
    da: 'Reaktionskapacitet',
    sv: 'Reaktionsf\u00f6rm\u00e5ga',
    de: 'Reaktionsf\u00e4higkeit',
  },
  'settings.handlingDesc': {
    en: 'How the system is able to respond to demand at the point of transaction. Mark one as "one-stop" for the Perfect metric.',
    da: 'Hvordan systemet kan reagere p\u00e5 eftersp\u00f8rgsel ved transaktionspunktet. Mark\u00e9r \u00e9n som "one-stop" for Perfect-m\u00e5lingen.',
    sv: 'Hur systemet kan svara p\u00e5 efterfr\u00e5gan vid transaktionspunkten. Markera en som "one-stop" f\u00f6r Perfect-m\u00e5ttet.',
    de: 'Wie das System auf Nachfrage am Transaktionspunkt reagieren kann. Markieren Sie eine als "One-Stop" f\u00fcr die Perfect-Metrik.',
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
  'settings.standardType': {
    en: 'standard',
    da: 'standard',
    sv: 'standard',
    de: 'Standard',
  },
  'settings.measuredToMilestone': {
    en: 'Measured to',
    da: 'Måles til',
    sv: 'Mäts till',
    de: 'Gemessen bis',
  },
  'settings.add': {
    en: 'Add',
    da: 'Tilføj',
    sv: 'Lägg till',
    de: 'Hinzufügen',
  },
  'settings.save': {
    en: 'Save',
    da: 'Gem',
    sv: 'Spara',
    de: 'Speichern',
  },
  'settings.editLabel': {
    en: 'Edit name',
    da: 'Rediger navn',
    sv: 'Redigera namn',
    de: 'Name bearbeiten',
  },
  'settings.saved': {
    en: 'Saved',
    da: 'Gemt',
    sv: 'Sparat',
    de: 'Gespeichert',
  },
  'settings.addHandling': {
    en: 'Add capability of response...',
    da: 'Tilf\u00f8j reaktionskapacitet...',
    sv: 'L\u00e4gg till reaktionsf\u00f6rm\u00e5ga...',
    de: 'Reaktionsf\u00e4higkeit hinzuf\u00fcgen...',
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
  'settings.lifeProblems': {
    en: 'Life Problem To Be Solved',
    da: 'Livsproblem der skal l\u00f8ses',
    sv: 'Livsproblem som ska l\u00f6sas',
    de: 'Zu l\u00f6sendes Lebensproblem',
  },
  'settings.lifeProblemsDesc': {
    en: 'The underlying purpose the customer is trying to achieve. Captured per demand to surface common life-problems the service is failing to enable.',
    da: 'Det underliggende form\u00e5l, kunden fors\u00f8ger at opn\u00e5. Registreres pr. efterspørgsel for at finde almindelige livsproblemer, servicen ikke understøtter.',
    sv: 'Det underliggande syfte kunden f\u00f6rs\u00f6ker uppn\u00e5. Registreras per efterfr\u00e5gan f\u00f6r att hitta vanliga livsproblem som tj\u00e4nsten inte st\u00f6djer.',
    de: 'Der zugrundeliegende Zweck, den der Kunde erreichen will. Pro Nachfrage erfasst, um gemeinsame Lebensprobleme aufzudecken, die der Service nicht unterst\u00fctzt.',
  },
  'settings.addLifeProblem': {
    en: 'Add life problem...',
    da: 'Tilf\u00f8j livsproblem...',
    sv: 'L\u00e4gg till livsproblem...',
    de: 'Lebensproblem hinzuf\u00fcgen...',
  },
  'capture.lifeProblemLabel': {
    en: 'Life problem to be solved',
    da: 'Livsproblem der skal l\u00f8ses',
    sv: 'Livsproblem som ska l\u00f6sas',
    de: 'Zu l\u00f6sendes Lebensproblem',
  },
  'capture.lifeProblemPlaceholder': {
    en: 'Select life problem...',
    da: 'V\u00e6lg livsproblem...',
    sv: 'V\u00e4lj livsproblem...',
    de: 'Lebensproblem w\u00e4hlen...',
  },
  'capture.thinkingLogicLabel': {
    en: 'Why this thinking shows up here',
    da: 'Hvorfor denne t\u00e6nkning viser sig her',
    sv: 'Varför detta t\u00e4nkande visar sig h\u00e4r',
    de: 'Warum diese Denkweise hier auftaucht',
  },
  'capture.thinkingLogicPlaceholder': {
    en: 'Capture the reasoning — what made this thinking visible in this demand?',
    da: 'Indfang ræsonnementet — hvad gjorde denne t\u00e6nkning synlig i denne efterspørgsel?',
    sv: 'Fånga resonemanget — vad gjorde detta t\u00e4nkande synligt i denna efterfrågan?',
    de: 'Erfassen Sie die Begr\u00fcndung — was machte diese Denkweise in dieser Nachfrage sichtbar?',
  },
  'capture.addThinkingButton': {
    en: '+ Add thinking',
    da: '+ Tilføj t\u00e6nkning',
    sv: '+ L\u00e4gg till t\u00e4nkande',
    de: '+ Denkweise hinzuf\u00fcgen',
  },
  'capture.selectThinking': {
    en: 'Select thinking to add...',
    da: 'V\u00e6lg t\u00e6nkning at tilføje...',
    sv: 'V\u00e4lj t\u00e4nkande att l\u00e4gga till...',
    de: 'Denkweise zum Hinzuf\u00fcgen w\u00e4hlen...',
  },
  // Helps / Hinders labels — explicit customer-lens framing (Ali feedback
  // 2026-04-16): Vanguard only studies the system through the customer's
  // eyes. A "helps" from the contact centre's view is irrelevant — only
  // whether the system condition helps or hinders the customer's purpose.
  'capture.scHelps': {
    en: "Helps customer's purpose",
    da: 'Hj\u00e6lper kundens form\u00e5l',
    sv: 'Hj\u00e4lper kundens syfte',
    de: 'F\u00f6rdert Kundenzweck',
  },
  'capture.scHinders': {
    en: "Hinders customer's purpose",
    da: 'Hindrer kundens form\u00e5l',
    sv: 'Hindrar kundens syfte',
    de: 'Hemmt Kundenzweck',
  },
  'capture.scDimensionHint': {
    en: "Look from the customer's point of view, not the organisation's.",
    da: 'Se det fra kundens synspunkt, ikke organisationens.',
    sv: 'Betrakta det ur kundens synvinkel, inte organisationens.',
    de: 'Aus Sicht des Kunden betrachten, nicht der Organisation.',
  },
  'capture.addSystemConditionButton': {
    en: '+ Add system condition',
    da: '+ Tilføj systemtilstand',
    sv: '+ L\u00e4gg till systemvillkor',
    de: '+ Systemzustand hinzuf\u00fcgen',
  },
  // aria label for the \u00d7 on a chosen system-condition chip.
  'capture.removeSystemCondition': {
    en: 'Remove system condition',
    da: 'Fjern systemtilstand',
    sv: 'Ta bort systemvillkor',
    de: 'Systemzustand entfernen',
  },
  'capture.selectSystemCondition': {
    en: 'Select system condition to add...',
    da: 'V\u00e6lg systemtilstand at tilføje...',
    sv: 'V\u00e4lj systemvillkor att l\u00e4gga till...',
    de: 'Systemzustand zum Hinzuf\u00fcgen w\u00e4hlen...',
  },
  'capture.addWorkBlockButton': {
    en: '+ Add block',
    da: '+ Tilf\u00f8j blok',
    sv: '+ L\u00e4gg till block',
    de: '+ Block hinzuf\u00fcgen',
  },
  'capture.insertWorkBlock': {
    en: 'Insert step here',
    da: 'Inds\u00e6t trin her',
    sv: 'Infoga steg h\u00e4r',
    de: 'Schritt hier einf\u00fcgen',
  },
  'capture.workBlockDate': {
    en: 'Step date',
    da: 'Trindato',
    sv: 'Stegdatum',
    de: 'Schrittdatum',
  },
  // One date for the whole work entry (2026-07-02) — replaces the per-block date.
  'capture.workEntryDate': {
    en: 'Date',
    da: 'Dato',
    sv: 'Datum',
    de: 'Datum',
  },
  // Drag-reorder of saved touches (migration 0034): the date-confirm panel.
  'capture.reorderDateTitle': {
    en: 'Date for this touch',
    da: 'Dato for denne kontakt',
    sv: 'Datum för denna kontakt',
    de: 'Datum für diesen Kontakt',
  },
  'capture.reorderDateHint': {
    en: 'Set the date so it fits its new place in the sequence.',
    da: 'Sæt datoen, så den passer til den nye placering i rækkefølgen.',
    sv: 'Ange datumet så att det passar dess nya plats i sekvensen.',
    de: 'Lege das Datum fest, damit es an die neue Position in der Abfolge passt.',
  },
  'capture.reorderSave': {
    en: 'Save',
    da: 'Gem',
    sv: 'Spara',
    de: 'Speichern',
  },
  'capture.reorderCancel': {
    en: 'Cancel',
    da: 'Annullér',
    sv: 'Avbryt',
    de: 'Abbrechen',
  },
  'capture.workBlockTagValue': {
    en: 'Value',
    da: 'V\u00e6rdi',
    sv: 'V\u00e4rde',
    de: 'Wert',
  },
  'capture.workBlockTagSequence': {
    en: 'SEQ',
    da: 'SEQ',
    sv: 'SEQ',
    de: 'SEQ',
  },
  'capture.workBlockTagFailure': {
    en: 'Failure',
    da: 'Ikke-værdi',
    sv: 'Icke-värde',
    de: 'Fehler',
  },
  // 4th flow step-kind: the step IS a failure demand (a demand hitting you),
  // distinct from failure WORK above. DA/SV use the canonical IVS abbreviation
  // (Ikke-værdiskabende / Icke-värdeskapande) per the glossary.
  'capture.workBlockTagFailureDemand': {
    en: 'Failure demand',
    da: 'IVS-efterspørgsel',
    sv: 'IVS-efterfrågan',
    de: 'Fehlernachfrage',
  },
  'capture.workBlockPlaceholder': {
    en: 'Describe this step...',
    da: 'Beskriv dette trin...',
    sv: 'Beskriv detta steg...',
    de: 'Beschreibe diesen Schritt...',
  },
  // Free-text placeholder on a 'failure demand' step — capture what the
  // customer is coming to you about (the demand in their words).
  'capture.failureDemandPlaceholder': {
    en: 'What is the customer coming to you about?',
    da: 'Hvad henvender kunden sig om?',
    sv: 'Vad hör kunden av sig om?',
    de: 'Worum geht es dem Kunden?',
  },
  // Phase 4 (2026-04-16) — picker option labels on each Flow block
  'capture.workStepPickerPlaceholder': {
    en: 'Select a work step…',
    da: 'Vælg et arbejdstrin…',
    sv: 'Välj ett arbetssteg…',
    de: 'Arbeitsschritt auswählen…',
  },
  'capture.workStepPickerFreeText': {
    en: '— Free-text step',
    da: '— Fritekst-trin',
    sv: '— Fritext-steg',
    de: '— Freitext-Schritt',
  },
  'capture.workStepClearAria': {
    en: 'Clear step',
    da: 'Ryd trin',
    sv: 'Rensa steg',
    de: 'Schritt löschen',
  },
  'capture.legacyVerbatimNotice': {
    en: 'Legacy entry — original description (read-only). Adding a block below will replace this.',
    da: 'Gammel registrering — oprindelig beskrivelse (skrivebeskyttet). Tilf\u00f8j en blok nedenfor for at erstatte den.',
    sv: 'Tidigare post — ursprunglig beskrivning (skrivskyddad). Om du l\u00e4gger till ett block nedan ers\u00e4tts den.',
    de: 'Alter Eintrag — urspr\u00fcngliche Beschreibung (schreibgesch\u00fctzt). Ein neuer Block unten ersetzt sie.',
  },
  'capture.workBlocksLabel': {
    en: 'Flow (value work + failure work)',
    da: 'Forl\u00f8b (v\u00e6rdiskabende arbejde + ikke-v\u00e6rdiskabende arbejde)',
    sv: 'Fl\u00f6de (v\u00e4rdeskapande arbete + icke-v\u00e4rdeskapande arbete)',
    de: 'Ablauf (Wertarbeit + Fehlerarbeit)',
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
  'dashboard.purpose': {
    en: 'Purpose',
    da: 'Formål',
    sv: 'Syfte',
    de: 'Zweck',
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
  'dashboard.custom': {
    en: 'Custom',
    da: 'Vælg',
    sv: 'Välj',
    de: 'Wählen',
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
    en: 'No entries yet',
    da: 'Ingen registreringer endnu',
    sv: 'Inga poster ännu',
    de: 'Noch keine Einträge',
  },
  'dashboard.executiveSummary': {
    en: 'Executive Summary',
    da: 'Sammenfatning',
    sv: 'Sammanfattning',
    de: 'Zusammenfassung',
  },
  'dashboard.topDemandType': {
    en: 'Top demand type',
    da: 'Hyppigste efterspørgselstype',
    sv: 'Vanligaste efterfrågetyp',
    de: 'Häufigste Nachfrageart',
  },
  'dashboard.topFailureFlow': {
    en: 'Top failure flow',
    da: 'Hyppigste fejl-flow',
    sv: 'Vanligaste felflöde',
    de: 'Häufigster Fehlerfluss',
  },
  'dashboard.topFailureCause': {
    en: 'Top system condition',
    da: 'Hyppigste systemforhold',
    sv: 'Vanligaste systemvillkor',
    de: 'Häufigste Systembedingung',
  },
  'dashboard.demandTabHelp': {
    en: 'What customers are asking for — types, patterns, and value vs failure split',
    da: 'Hvad kunderne efterspørger — typer, mønstre og værdi vs. fejl-fordeling',
    sv: 'Vad kunderna efterfrågar — typer, mönster och värde vs. felsplit',
    de: 'Was Kunden nachfragen — Typen, Muster und Wert- vs. Fehler-Aufteilung',
  },
  'dashboard.workTabHelp': {
    en: 'How work flows through the system — capability of response, and flow analysis',
    da: 'Hvordan arbejdet flyder gennem systemet — reaktionskapacitet og flowanalyse',
    sv: 'Hur arbetet flödar genom systemet — reaktionsförmåga och flödesanalys',
    de: 'Wie Arbeit durch das System fließt — Reaktionsfähigkeit und Flussanalyse',
  },
  'dashboard.overviewTabHelp': {
    en: 'The full picture — all demand data, system conditions, and what matters to customers',
    da: 'Det fulde billede — alle efterspørgselsdata, systemforhold og det der betyder noget for kunderne',
    sv: 'Hela bilden — all efterfrågedata, systemvillkor och det som betyder något för kunderna',
    de: 'Das Gesamtbild — alle Nachfragedaten, Systembedingungen und was den Kunden wichtig ist',
  },
  // Capability / lead-time (2026-06-18). Vanguard terms sourced from the vault:
  // capability chart = kapabilitetsgraf; control limits = kontrolgrænse(r) (DA
  // ØKG/NKG, SV ÖKG/NKG); special-cause = speciel årsagsvariation / speciella orsaker.
  'dashboard.capabilityTab': {
    en: 'Capability',
    da: 'Kapabilitet',
    sv: 'Kapabilitet',
    de: 'Kapabilität',
  },
  'dashboard.capabilityTabHelp': {
    en: 'Lead time between two events across cases — the capability chart shows how predictable the process is.',
    da: 'Gennemløbstid mellem to hændelser på tværs af sager — kapabilitetsgrafen viser, hvor forudsigelig processen er.',
    sv: 'Ledtid mellan två händelser över ärenden — kapabilitetsgrafen visar hur förutsägbar processen är.',
    de: 'Durchlaufzeit zwischen zwei Ereignissen über Fälle — die Kapabilitätsgrafik zeigt, wie vorhersehbar der Prozess ist.',
  },
  'dashboard.synthesisTab': {
    en: 'Synthesise',
    da: 'Syntetisér',
    sv: 'Syntetisera',
    de: 'Synthese',
  },
  'dashboard.synthesisTabHelp': {
    en: 'Study what you have captured and merge the labels that are really the same onto one agreed name.',
    da: 'Studér det, du har opfanget, og slå de betegnelser sammen, der reelt er det samme, til ét aftalt navn.',
    sv: 'Studera det du fångat och slå ihop de beteckningar som egentligen är samma till ett överenskommet namn.',
    de: 'Studieren Sie das Erfasste und führen Sie die wirklich gleichen Bezeichnungen unter einem vereinbarten Namen zusammen.',
  },
  'dashboard.analyticsTab': {
    en: 'Analytics',
    da: 'Analyse',
    sv: 'Analys',
    de: 'Analyse',
  },
  'dashboard.scopeAll': {
    en: 'All data',
    da: 'Alle data',
    sv: 'Alla data',
    de: 'Alle Daten',
  },
  'dashboard.analyticsTabHelp': {
    en: 'The work picture for this flow — value vs failure work, work types, and how the work splits over time.',
    da: 'Arbejdsbilledet for dette flow — værdiskabende vs. ikke-værdiskabende arbejde, arbejdstyper, og hvordan arbejdet fordeler sig over tid.',
    sv: 'Arbetsbilden för detta flöde — värdeskapande vs. icke-värdeskapande arbete, arbetstyper, och hur arbetet fördelar sig över tid.',
    de: 'Das Arbeitsbild für diesen Flow — wertschöpfende vs. fehlerhafte Arbeit, Arbeitstypen und wie sich die Arbeit über die Zeit verteilt.',
  },
  'synthesis.heading': {
    en: 'Synthesise system conditions',
    da: 'Syntetisér systemforhold',
    sv: 'Syntetisera systemvillkor',
    de: 'Systembedingungen zusammenführen',
  },
  'synthesis.intro': {
    en: 'As you study the captured system conditions, you will find categories that are really the same thing. Judge each one against the others — Same, Similar or Different — and merge the sames and similars onto one agreed name. The change ripples back through every record already linked to them.',
    da: 'Når du studerer de opfangede systemforhold, vil du finde kategorier, der reelt er det samme. Vurdér hver enkelt mod de andre — Samme, Lignende eller Forskellige — og slå de samme og lignende sammen til ét aftalt navn. Ændringen slår igennem på alle de poster, der allerede er knyttet til dem.',
    sv: 'När du studerar de fångade systemvillkoren hittar du kategorier som egentligen är samma sak. Bedöm varje mot de andra — Samma, Liknande eller Olika — och slå ihop de samma och liknande till ett överenskommet namn. Ändringen slår igenom på alla poster som redan är kopplade till dem.',
    de: 'Beim Studieren der erfassten Systembedingungen finden Sie Kategorien, die eigentlich dasselbe sind. Beurteilen Sie jede im Vergleich zu den anderen — Gleich, Ähnlich oder Verschieden — und führen Sie die gleichen und ähnlichen unter einem vereinbarten Namen zusammen. Die Änderung wirkt sich auf alle bereits verknüpften Datensätze aus.',
  },
  'synthesis.selectHint': {
    en: 'Select the ones that are the same or similar, then merge them.',
    da: 'Vælg dem, der er samme eller lignende, og slå dem derefter sammen.',
    sv: 'Välj de som är samma eller liknande och slå sedan ihop dem.',
    de: 'Wählen Sie die gleichen oder ähnlichen aus und führen Sie sie dann zusammen.',
  },
  'synthesis.distributionTitle': {
    en: 'How often each appears',
    da: 'Hvor ofte hver enkelt optræder',
    sv: 'Hur ofta var och en förekommer',
    de: 'Wie häufig jedes vorkommt',
  },
  'synthesis.pieTitle': {
    en: 'Share of each',
    da: 'Hver enkelts andel',
    sv: 'Var och ens andel',
    de: 'Anteil jedes Einzelnen',
  },
  'synthesis.overTimeTitle': {
    en: 'Over time',
    da: 'Over tid',
    sv: 'Över tid',
    de: 'Im Zeitverlauf',
  },
  'synthesis.overTimeTopN': {
    en: 'Showing the most frequent conditions; less frequent ones are not plotted.',
    da: 'Viser de hyppigste forhold; mindre hyppige er ikke vist.',
    sv: 'Visar de vanligaste villkoren; mindre vanliga visas inte.',
    de: 'Zeigt die häufigsten Bedingungen; seltenere werden nicht dargestellt.',
  },
  'synthesis.mergeInto': {
    en: 'Keep as one',
    da: 'Behold som én',
    sv: 'Behåll som en',
    de: 'Als eine behalten',
  },
  'synthesis.renameOptional': {
    en: 'Agreed name (optional)',
    da: 'Aftalt navn (valgfrit)',
    sv: 'Överenskommet namn (valfritt)',
    de: 'Vereinbarter Name (optional)',
  },
  'synthesis.mergeButton': {
    en: 'Merge',
    da: 'Slå sammen',
    sv: 'Slå ihop',
    de: 'Zusammenführen',
  },
  'synthesis.cancel': {
    en: 'Cancel',
    da: 'Annullér',
    sv: 'Avbryt',
    de: 'Abbrechen',
  },
  'synthesis.rename': {
    en: 'Rename',
    da: 'Omdøb',
    sv: 'Byt namn',
    de: 'Umbenennen',
  },
  'synthesis.recentMerges': {
    en: 'Recent merges',
    da: 'Seneste sammenlægninger',
    sv: 'Senaste sammanslagningar',
    de: 'Letzte Zusammenführungen',
  },
  'synthesis.undo': {
    en: 'Undo',
    da: 'Fortryd',
    sv: 'Ångra',
    de: 'Rückgängig',
  },
  'synthesis.empty': {
    en: 'No system conditions captured yet.',
    da: 'Der er endnu ikke opfanget nogen systemforhold.',
    sv: 'Inga systemvillkor har fångats ännu.',
    de: 'Noch keine Systembedingungen erfasst.',
  },
  'synthesis.mergeFailed': {
    en: 'Could not merge. Please try again.',
    da: 'Kunne ikke slå sammen. Prøv igen.',
    sv: 'Kunde inte slå ihop. Försök igen.',
    de: 'Zusammenführen fehlgeschlagen. Bitte erneut versuchen.',
  },
  'synthesis.renameFailed': {
    en: 'Could not rename. Please try again.',
    da: 'Kunne ikke omdøbe. Prøv igen.',
    sv: 'Kunde inte byta namn. Försök igen.',
    de: 'Umbenennen fehlgeschlagen. Bitte erneut versuchen.',
  },
  'synthesis.undoFailed': {
    en: 'Could not undo. Please try again.',
    da: 'Kunne ikke fortryde. Prøv igen.',
    sv: 'Kunde inte ångra. Försök igen.',
    de: 'Rückgängig machen fehlgeschlagen. Bitte erneut versuchen.',
  },
  // Sub-tab labels for the synthesis surface (which taxonomy to synthesise).
  'synthesis.taxSc': {
    en: 'System conditions',
    da: 'Systemforhold',
    sv: 'Systemvillkor',
    de: 'Systembedingungen',
  },
  'synthesis.taxWt': {
    en: 'Work types',
    da: 'Arbejdstyper',
    sv: 'Arbetstyper',
    de: 'Arbeitstypen',
  },
  'synthesis.taxWst': {
    en: 'Work steps',
    da: 'Arbejdstrin',
    sv: 'Arbetssteg',
    de: 'Arbeitsschritte',
  },
  // Work types synthesis.
  'synthesis.wtHeading': {
    en: 'Synthesise work types',
    da: 'Syntetisér arbejdstyper',
    sv: 'Syntetisera arbetstyper',
    de: 'Arbeitstypen zusammenführen',
  },
  'synthesis.wtIntro': {
    en: 'As you study the captured work types, you will find labels that are really the same kind of work. Judge each against the others — Same, Similar or Different — and merge the sames and similars onto one agreed name. The change ripples back through every record already labelled with them.',
    da: 'Når du studerer de opfangede arbejdstyper, vil du finde betegnelser, der reelt er samme slags arbejde. Vurdér hver enkelt mod de andre — Samme, Lignende eller Forskellige — og slå de samme og lignende sammen til ét aftalt navn. Ændringen slår igennem på alle de poster, der allerede er mærket med dem.',
    sv: 'När du studerar de fångade arbetstyperna hittar du beteckningar som egentligen är samma slags arbete. Bedöm varje mot de andra — Samma, Liknande eller Olika — och slå ihop de samma och liknande till ett överenskommet namn. Ändringen slår igenom på alla poster som redan är märkta med dem.',
    de: 'Beim Studieren der erfassten Arbeitstypen finden Sie Bezeichnungen, die eigentlich dieselbe Art von Arbeit sind. Beurteilen Sie jede im Vergleich zu den anderen — Gleich, Ähnlich oder Verschieden — und führen Sie die gleichen und ähnlichen unter einem vereinbarten Namen zusammen. Die Änderung wirkt sich auf alle bereits damit gekennzeichneten Datensätze aus.',
  },
  'synthesis.wtEmpty': {
    en: 'No work types captured yet.',
    da: 'Der er endnu ikke opfanget nogen arbejdstyper.',
    sv: 'Inga arbetstyper har fångats ännu.',
    de: 'Noch keine Arbeitstypen erfasst.',
  },
  // Work step types synthesis.
  'synthesis.wstHeading': {
    en: 'Synthesise work steps',
    da: 'Syntetisér arbejdstrin',
    sv: 'Syntetisera arbetssteg',
    de: 'Arbeitsschritte zusammenführen',
  },
  'synthesis.wstIntro': {
    en: 'As you study the captured work steps, you will find labels that are really the same step. Judge each against the others — Same, Similar or Different — and merge the sames and similars onto one agreed name. The change ripples back through every work block already labelled with them.',
    da: 'Når du studerer de opfangede arbejdstrin, vil du finde betegnelser, der reelt er samme trin. Vurdér hver enkelt mod de andre — Samme, Lignende eller Forskellige — og slå de samme og lignende sammen til ét aftalt navn. Ændringen slår igennem på alle de arbejdsblokke, der allerede er mærket med dem.',
    sv: 'När du studerar de fångade arbetsstegen hittar du beteckningar som egentligen är samma steg. Bedöm varje mot de andra — Samma, Liknande eller Olika — och slå ihop de samma och liknande till ett överenskommet namn. Ändringen slår igenom på alla arbetsblock som redan är märkta med dem.',
    de: 'Beim Studieren der erfassten Arbeitsschritte finden Sie Bezeichnungen, die eigentlich derselbe Schritt sind. Beurteilen Sie jeden im Vergleich zu den anderen — Gleich, Ähnlich oder Verschieden — und führen Sie die gleichen und ähnlichen unter einem vereinbarten Namen zusammen. Die Änderung wirkt sich auf alle bereits damit gekennzeichneten Arbeitsblöcke aus.',
  },
  'synthesis.wstEmpty': {
    en: 'No work steps captured yet.',
    da: 'Der er endnu ikke opfanget nogen arbejdstrin.',
    sv: 'Inga arbetssteg har fångats ännu.',
    de: 'Noch keine Arbeitsschritte erfasst.',
  },
  'dashboard.capabilityLeadTime': {
    en: 'Capability — lead time between events',
    da: 'Kapabilitet — gennemløbstid mellem hændelser',
    sv: 'Kapabilitet — ledtid mellan händelser',
    de: 'Kapabilität — Durchlaufzeit zwischen Ereignissen',
  },
  'dashboard.eventFrom': {
    en: 'From',
    da: 'Fra',
    sv: 'Från',
    de: 'Von',
  },
  'dashboard.eventTo': {
    en: 'To',
    da: 'Til',
    sv: 'Till',
    de: 'Bis',
  },
  'dashboard.evCaseOpened': {
    en: 'Case opened',
    da: 'Sag åbnet',
    sv: 'Ärende öppnat',
    de: 'Fall eröffnet',
  },
  'dashboard.evFirstContact': {
    en: 'First contact',
    da: 'Første kontakt',
    sv: 'Första kontakt',
    de: 'Erster Kontakt',
  },
  'dashboard.evCaseClosed': {
    en: 'Case closed',
    da: 'Sag lukket',
    sv: 'Ärende stängt',
    de: 'Fall geschlossen',
  },
  'dashboard.processAvg': {
    en: 'Average',
    da: 'Gennemsnit',
    sv: 'Medel',
    de: 'Mittelwert',
  },
  'dashboard.upperLimit': {
    en: 'Upper limit (UCL)',
    da: 'Øvre kontrolgrænse (ØKG)',
    sv: 'Övre kontrollgräns (ÖKG)',
    de: 'Obere Kontrollgrenze',
  },
  'dashboard.lowerLimit': {
    en: 'Lower limit (LCL)',
    da: 'Nedre kontrolgrænse (NKG)',
    sv: 'Nedre kontrollgräns (NKG)',
    de: 'Untere Kontrollgrenze',
  },
  'dashboard.signals': {
    en: 'Special-cause cases',
    da: 'Speciel årsagsvariation',
    sv: 'Speciella orsaker',
    de: 'Spezielle Ursachen',
  },
  'dashboard.leadTimeDays': {
    en: 'Lead time (days)',
    da: 'Gennemløbstid (dage)',
    sv: 'Ledtid (dagar)',
    de: 'Durchlaufzeit (Tage)',
  },
  'dashboard.daysShort': {
    en: 'd',
    da: 'd',
    sv: 'd',
    de: 'T',
  },
  'dashboard.capabilityCases': {
    en: 'Cases',
    da: 'Sager',
    sv: 'Ärenden',
    de: 'Fälle',
  },
  'dashboard.capabilityMedian': {
    en: 'Median',
    da: 'Median',
    sv: 'Median',
    de: 'Median',
  },
  'dashboard.capabilitySelectEvents': {
    en: 'Pick two events to measure the time between them.',
    da: 'Vælg to hændelser for at måle tiden mellem dem.',
    sv: 'Välj två händelser för att mäta tiden mellan dem.',
    de: 'Wählen Sie zwei Ereignisse, um die Zeit dazwischen zu messen.',
  },
  'dashboard.capabilityNoData': {
    en: 'No cases have both of those events recorded yet.',
    da: 'Ingen sager har begge hændelser registreret endnu.',
    sv: 'Inga ärenden har båda händelserna registrerade ännu.',
    de: 'Noch keine Fälle mit beiden Ereignissen erfasst.',
  },
  'dashboard.capabilityNeedMore': {
    en: 'Limits appear once at least 2 cases have both events.',
    da: 'Grænser vises, når mindst 2 sager har begge hændelser.',
    sv: 'Gränser visas när minst 2 ärenden har båda händelserna.',
    de: 'Grenzen erscheinen, sobald mindestens 2 Fälle beide Ereignisse haben.',
  },
  // R11: stacked charts + full-study spreadsheet.
  'dashboard.addChart': {
    en: 'Add chart',
    da: 'Tilføj graf',
    sv: 'Lägg till diagram',
    de: 'Diagramm hinzufügen',
  },
  'dashboard.removeChart': {
    en: 'Remove',
    da: 'Fjern',
    sv: 'Ta bort',
    de: 'Entfernen',
  },
  'dashboard.downloadAllData': {
    en: 'Download data',
    da: 'Download data',
    sv: 'Ladda ner data',
    de: 'Daten herunterladen',
  },
  // R10: second capability metric — touches per case.
  'dashboard.metricLabel': {
    en: 'Measure',
    da: 'Mål',
    sv: 'Mått',
    de: 'Maß',
  },
  'dashboard.metricLeadTime': {
    en: 'Lead time',
    da: 'Gennemløbstid',
    sv: 'Ledtid',
    de: 'Durchlaufzeit',
  },
  'dashboard.metricTouches': {
    en: 'Touches',
    da: 'Registreringer',
    sv: 'Poster',
    de: 'Einträge',
  },
  'dashboard.metricVariance': {
    en: 'Early/late',
    da: 'Før/efter',
    sv: 'Före/efter',
    de: 'Früher/später',
  },
  'dashboard.metricVarianceAxis': {
    en: 'Days early (−) / late (+)',
    da: 'Dage før (−) / efter (+)',
    sv: 'Dagar före (−) / efter (+)',
    de: 'Tage früher (−) / später (+)',
  },
  'dashboard.scopeWhatMatters': {
    en: 'What matters',
    da: 'Hvad betyder noget',
    sv: 'Vad är viktigt',
    de: 'Was wichtig ist',
  },
  'dashboard.wmMetOnTime': {
    en: 'Met the date',
    da: 'Nåede datoen',
    sv: 'Klarade datumet',
    de: 'Termin gehalten',
  },
  'dashboard.wmMissedLate': {
    en: 'Missed (late)',
    da: 'Overskredet',
    sv: 'Missade (sent)',
    de: 'Verpasst (spät)',
  },
  'dashboard.wmAvgDaysLate': {
    en: 'Avg days late',
    da: 'Gns. dage forsinket',
    sv: 'Snitt dagar sent',
    de: 'Ø Tage verspätet',
  },
  'dashboard.touchesPerCase': {
    en: 'Touches per case',
    da: 'Registreringer pr. sag',
    sv: 'Poster per ärende',
    de: 'Einträge pro Fall',
  },
  // Touches-over-time chart (per-day series, scoped, count/%).
  'dashboard.touchesOverTime': {
    en: 'Touches over time',
    da: 'Registreringer over tid',
    sv: 'Poster över tid',
    de: 'Einträge über die Zeit',
  },
  'dashboard.touchesTotal': {
    en: 'Total touches',
    da: 'Registreringer i alt',
    sv: 'Poster totalt',
    de: 'Einträge gesamt',
  },
  'dashboard.scopeCase': {
    en: 'Case',
    da: 'Sag',
    sv: 'Ärende',
    de: 'Fall',
  },
  'dashboard.countMode': {
    en: 'Count',
    da: 'Antal',
    sv: 'Antal',
    de: 'Anzahl',
  },
  'dashboard.pctMode': {
    en: '%',
    da: '%',
    sv: '%',
    de: '%',
  },
  // R7: capability point ordering + image export.
  'dashboard.sortLabel': {
    en: 'Order',
    da: 'Rækkefølge',
    sv: 'Ordning',
    de: 'Reihenfolge',
  },
  'dashboard.sortStart': {
    en: 'Start date',
    da: 'Startdato',
    sv: 'Startdatum',
    de: 'Startdatum',
  },
  'dashboard.sortClosed': {
    en: 'Close date',
    da: 'Lukkedato',
    sv: 'Stängningsdatum',
    de: 'Abschlussdatum',
  },
  'dashboard.exportImage': {
    en: 'Export image',
    da: 'Eksportér billede',
    sv: 'Exportera bild',
    de: 'Bild exportieren',
  },
  // R4: exclude / annotate a datapoint (per measure).
  'dashboard.capabilityInspectHint': {
    en: 'Tip: click a point to exclude it from the limits or add a note.',
    da: 'Tip: klik på et punkt for at udelade det fra grænserne eller tilføje en note.',
    sv: 'Tips: klicka på en punkt för att utesluta den från gränserna eller lägga till en notis.',
    de: 'Tipp: Klicken Sie auf einen Punkt, um ihn von den Grenzen auszuschließen oder eine Notiz hinzuzufügen.',
  },
  'dashboard.excludedLegend': {
    en: 'Excluded',
    da: 'Udeladt',
    sv: 'Utesluten',
    de: 'Ausgeschlossen',
  },
  'dashboard.capabilityExclude': {
    en: 'Exclude from limits',
    da: 'Udelad fra grænser',
    sv: 'Uteslut från gränser',
    de: 'Von Grenzen ausschließen',
  },
  'dashboard.capabilityInclude': {
    en: 'Include again',
    da: 'Medtag igen',
    sv: 'Inkludera igen',
    de: 'Wieder einbeziehen',
  },
  'dashboard.capabilityReason': {
    en: 'Why excluded? (optional)',
    da: 'Hvorfor udeladt? (valgfrit)',
    sv: 'Varför utesluten? (valfritt)',
    de: 'Warum ausgeschlossen? (optional)',
  },
  'dashboard.capabilityNote': {
    en: 'Note',
    da: 'Note',
    sv: 'Notis',
    de: 'Notiz',
  },
  'dashboard.capabilityNotePh': {
    en: 'Add a note about this case…',
    da: 'Tilføj en note om denne sag…',
    sv: 'Lägg till en notis om detta ärende…',
    de: 'Notiz zu diesem Fall hinzufügen…',
  },
  'dashboard.capabilityClose': {
    en: 'Close',
    da: 'Luk',
    sv: 'Stäng',
    de: 'Schließen',
  },
  'dashboard.noEntriesHint': {
    en: 'Share the access code with your team and start capturing demand on the Capture tab, or upload existing data via XLSX.',
    da: 'Del adgangskoden med dit team og begynd at registrere efterspørgsel via Registrér-fanen, eller upload eksisterende data via XLSX.',
    sv: 'Dela åtkomstkoden med ditt team och börja registrera efterfrågan via Registrera-fliken, eller ladda upp befintlig data via XLSX.',
    de: 'Teilen Sie den Zugangscode mit Ihrem Team und beginnen Sie mit der Erfassung über den Erfassungs-Tab, oder laden Sie bestehende Daten per XLSX hoch.',
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
    en: 'Capability of Response at Point of Transaction',
    da: 'Reaktionskapacitet ved transaktionspunktet',
    sv: 'Reaktionsf\u00f6rm\u00e5ga vid transaktionspunkten',
    de: 'Reaktionsf\u00e4higkeit am Transaktionspunkt',
  },
  'dashboard.handlingByClass': {
    en: 'Capability of Response: Value vs Failure',
    da: 'Reaktionskapacitet: V\u00e6rdiskabende vs. ikke-v\u00e6rdiskabende',
    sv: 'Reaktionsf\u00f6rm\u00e5ga: V\u00e4rdeskapande vs. icke-v\u00e4rdeskapande',
    de: 'Reaktionsf\u00e4higkeit: Wert vs. Fehler',
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
  'dashboard.failureFlow': {
    en: 'Where does failure demand come from?',
    da: 'Hvor kommer fejlefterspørgslen fra?',
    sv: 'Var kommer icke-värdeskapande efterfrågan ifrån?',
    de: 'Woher kommt die Fehlernachfrage?',
  },
  'dashboard.flowClickHint': {
    en: 'Click a flow to see system conditions',
    da: 'Klik på et flow for at se systemforhold',
    sv: 'Klicka på ett flöde för att se systemvillkor',
    de: 'Klicken Sie auf einen Fluss, um Systembedingungen zu sehen',
  },
  'dashboard.flowCauses': {
    en: 'System conditions',
    da: 'Systemforhold',
    sv: 'Systemvillkor',
    de: 'Systembedingungen',
  },
  'dashboard.flowCausesEmpty': {
    en: 'No system conditions recorded for this flow',
    da: 'Ingen systemforhold registreret for dette flow',
    sv: 'Inga systemvillkor registrerade för detta flöde',
    de: 'Keine Systembedingungen für diesen Fluss erfasst',
  },
  'dashboard.allTypes': {
    en: 'All',
    da: 'Alle',
    sv: 'Alla',
    de: 'Alle',
  },
  'dashboard.whatMattersThemes': {
    en: 'Common themes in what matters',
    da: 'Hyppige temaer i det der betyder noget',
    sv: 'Vanliga teman i det som betyder något',
    de: 'Häufige Themen bei dem was wichtig ist',
  },
  'dashboard.failureCauses': {
    en: 'Failure Causes (System Conditions)',
    da: '\u00c5rsager til ikke-v\u00e6rdiskabende eftersp\u00f8rgsel (systemforhold)',
    sv: 'Orsaker till icke-v\u00e4rdeskapande efterfr\u00e5gan (systemf\u00f6rh\u00e5llanden)',
    de: 'Fehlerursachen (Systembedingungen)',
  },
  'dashboard.helpingConditions': {
    en: 'Helping Conditions (System Conditions)',
    da: 'Hj\u00e6lpende forhold (systemforhold)',
    sv: 'Hj\u00e4lpande f\u00f6rh\u00e5llanden (systemf\u00f6rh\u00e5llanden)',
    de: 'Unterst\u00fctzende Bedingungen (Systembedingungen)',
  },
  'dashboard.lifeProblems': {
    en: 'Life Problems Being Solved',
    da: 'Livsproblemer der l\u00f8ses',
    sv: 'Livsproblem som l\u00f6ses',
    de: 'Zu l\u00f6sende Lebensprobleme',
  },
  // Phase 4C (2026-04-16) — Work Step analysis
  'dashboard.workStepAnalysis': {
    en: 'Work Step analysis',
    da: 'Arbejdstrins-analyse',
    sv: 'Analys av arbetssteg',
    de: 'Arbeitsschritt-Analyse',
  },
  'dashboard.topWorkSteps': {
    en: 'Top Work Steps',
    da: 'Mest almindelige arbejdstrin',
    sv: 'Vanligaste arbetssteg',
    de: 'Häufigste Arbeitsschritte',
  },
  'dashboard.workStepByWorkType': {
    en: 'Work Steps by Work Type',
    da: 'Arbejdstrin pr. arbejdstype',
    sv: 'Arbetssteg per arbetstyp',
    de: 'Arbeitsschritte nach Arbeitsart',
  },
  'dashboard.capabilityByWorkType': {
    en: 'Value vs Failure work by Work Type',
    da: 'Værdiskabende vs ikke-værdiskabende arbejde pr. arbejdstype',
    sv: 'Värdeskapande vs icke-värdeskapande arbete per arbetstyp',
    de: 'Wert- vs Fehlerarbeit nach Arbeitsart',
  },
  'dashboard.whatMatters': {
    en: 'What Matters to the Customer',
    da: 'Hvad betyder noget for kunden',
    sv: 'Vad \u00e4r viktigt f\u00f6r kunden',
    de: 'Was dem Kunden wichtig ist',
  },
  'dashboard.whatMattersByClass': {
    en: 'What Matters: Value vs Failure',
    da: 'Hvad betyder noget: V\u00e6rdi vs Fejl',
    sv: 'Vad \u00e4r viktigt: V\u00e4rde vs Fel',
    de: 'Was wichtig ist: Wert vs Fehler',
  },
  'dashboard.whatMattersNotes': {
    en: 'What Matters — Customer Notes',
    da: 'Hvad betyder noget — Kundenoter',
    sv: 'Vad är viktigt — Kundanteckningar',
    de: 'Was wichtig ist — Kundennotizen',
  },
  'dashboard.groupByDate': {
    en: 'By date',
    da: 'Efter dato',
    sv: 'Efter datum',
    de: 'Nach Datum',
  },
  'dashboard.groupByType': {
    en: 'By demand type',
    da: 'Efter type',
    sv: 'Efter typ',
    de: 'Nach Typ',
  },
  'dashboard.unclassified': {
    en: 'Unclassified',
    da: 'Ikke klassificeret',
    sv: 'Oklassificerad',
    de: 'Nicht klassifiziert',
  },
  'dashboard.valueConcentration': {
    en: 'Value Demand Concentration',
    da: 'Koncentration af værdiskabende efterspørgsel',
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
    en: 'Point of transaction',
    da: 'Transaktionspunkt',
    sv: 'Transaktionspunkt',
    de: 'Transaktionspunkt',
  },
  'capture.selectWorkSource': {
    en: 'Source of work?',
    da: 'Arbejdskilde?',
    sv: 'Arbetskälla?',
    de: 'Arbeitsquelle?',
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
  'settings.workSources': {
    en: 'Work sources',
    da: 'Arbejdskilder',
    sv: 'Arbetskällor',
    de: 'Arbeitsquellen',
  },
  'settings.workSourcesDesc': {
    en: 'Where work comes from — e.g. a ticket queue, an internal team, an escalation.',
    da: 'Hvor arbejdet kommer fra — fx en sagskø, et internt team eller en eskalering.',
    sv: 'Var arbetet kommer från — t.ex. en ärendekö, ett internt team eller en eskalering.',
    de: 'Woher die Arbeit kommt — z.\u00a0B. eine Ticket-Warteschlange, ein internes Team oder eine Eskalation.',
  },
  'settings.addWorkSource': {
    en: 'Add work source...',
    da: 'Tilføj arbejdskilde...',
    sv: 'Lägg till arbetskälla...',
    de: 'Arbeitsquelle hinzufügen...',
  },
  'settings.customerFacing': {
    en: 'Customer-facing',
    da: 'Kundevendt',
    sv: 'Kundvänd',
    de: 'Kundenkontakt',
  },
  'capture.whoAreYou': {
    en: 'Who are you?',
    da: 'Hvem er du?',
    sv: 'Vem är du?',
    de: 'Wer sind Sie?',
  },
  'capture.enterName': {
    en: 'Enter your name...',
    da: 'Indtast dit navn...',
    sv: 'Ange ditt namn...',
    de: 'Geben Sie Ihren Namen ein...',
  },
  'capture.continue': {
    en: 'Continue',
    da: 'Fortsæt',
    sv: 'Fortsätt',
    de: 'Weiter',
  },
  'capture.notYou': {
    en: 'Not you?',
    da: 'Ikke dig?',
    sv: 'Inte du?',
    de: 'Nicht Sie?',
  },
  'dashboard.collectionCoverage': {
    en: 'Data Collection Coverage',
    da: 'Dækningsgrad for dataindsamling',
    sv: 'Datainsamlingstäckning',
    de: 'Datenerfassungsabdeckung',
  },
  'dashboard.collectors': {
    en: 'Collectors',
    da: 'Indsamlere',
    sv: 'Insamlare',
    de: 'Erfasser',
  },
  'dashboard.totalCaptures': {
    en: 'Total captures',
    da: 'Registreringer i alt',
    sv: 'Totalt insamlade',
    de: 'Erfassungen gesamt',
  },
  'dashboard.lastCapture': {
    en: 'Last capture',
    da: 'Seneste registrering',
    sv: 'Senaste insamling',
    de: 'Letzte Erfassung',
  },
  'dashboard.lastActive': {
    en: 'Last active',
    da: 'Sidst aktiv',
    sv: 'Senast aktiv',
    de: 'Zuletzt aktiv',
  },

  // Work tracking
  'capture.demand': {
    en: 'Demand',
    da: 'Efterspørgsel',
    sv: 'Efterfrågan',
    de: 'Nachfrage',
  },
  'capture.work': {
    en: 'Work',
    da: 'Arbejde',
    sv: 'Arbete',
    de: 'Arbeit',
  },
  'capture.unknown': {
    en: '?',
    da: '?',
    sv: '?',
    de: '?',
  },
  // Sourced from Vanguard canonical framing (value work = delivers purpose;
  // failure work = everything else / waste). Previous copy mischaracterised
  // Work as "internal requests" which is closer to "internal demand".
  'capture.workHelp': {
    en: 'Work is the activity the service performs in response to demand.',
    da: 'Arbejde er den aktivitet, servicen udfører som svar på efterspørgsel.',
    sv: 'Arbete är den aktivitet tjänsten utför som svar på efterfrågan.',
    de: 'Arbeit ist die Tätigkeit, die der Dienst als Antwort auf Nachfrage ausführt.',
  },
  'capture.workClassificationHelp': {
    en: 'Value work: directly delivers the customer\'s purpose.\n\nSequence work: value in orientation but done at the wrong time or in the wrong way.\n\nFailure work: everything else — waste caused by system conditions.',
    da: 'Værdiskabende arbejde: leverer kundens formål direkte.\n\nSekvensarbejde: værdifuldt i retning, men gjort på det forkerte tidspunkt eller på den forkerte måde.\n\nIkke-værdiskabende arbejde: alt andet — spild forårsaget af systembetingelser.',
    sv: 'Värdeskapande arbete: levererar kundens syfte direkt.\n\nSekvensarbete: värdefullt i riktning men gjort vid fel tidpunkt eller på fel sätt.\n\nIcke-värdeskapande arbete: allt annat — slöseri orsakat av systemfaktorer.',
    de: 'Wertarbeit: liefert direkt den Zweck des Kunden.\n\nSequenzarbeit: wertvoll in der Ausrichtung, aber zur falschen Zeit oder auf die falsche Weise ausgeführt.\n\nFehlerarbeit: alles andere — Verschwendung, verursacht durch Systembedingungen.',
  },
  // Sourced from Jonas's Obsidian vault (03-Resources/concepts/value-demand.md,
  // failure-demand.md) and the Vanguard multilingual glossary. Danish terms are
  // canonical per "Riv servicefabrikkerne ned"; never use "fejlefterspørgsel".
  'capture.demandHelp': {
    en: 'Demand is placed on the system by our customers. If we are talking anyone other than a customer, this will be work.',
    da: 'Efterspørgsel er det, kunder placerer på systemet. Hvis vi taler om andre end kunden, er det arbejde.',
    sv: 'Efterfrågan är det kunder placerar på systemet. Om vi talar om någon annan än kunden är det arbete.',
    de: 'Nachfrage wird vom Kunden an das System gestellt. Wenn wir über jemand anderen als den Kunden sprechen, ist es Arbeit.',
  },
  'capture.thinkingScAttachLabel': {
    en: 'Attached to system conditions',
    da: 'Knyttet til systembetingelser',
    sv: 'Kopplat till systemvillkor',
    de: 'Verknüpft mit Systembedingungen',
  },
  // Sourced from value-demand.md + failure-demand.md in Jonas's Obsidian vault.
  // Danish/Swedish wording taken from the multilingual Vanguard glossary
  // (canonical per Riv servicefabrikkerne ned / Riv servicefabrikerna).
  'capture.demandClassificationHelp': {
    en: 'Value demand: demand the organisation exists to serve.\n\nFailure demand: demand caused by a failure to do something, or do something right — from the customer\'s perspective.',
    da: 'Værdiskabende efterspørgsel: efterspørgsel som organisationen findes for at betjene.\n\nIkke-værdiskabende efterspørgsel: efterspørgsel forårsaget af, at noget ikke er gjort, eller ikke er gjort rigtigt — set fra kundens perspektiv.',
    sv: 'Värdeskapande efterfrågan: efterfrågan som organisationen finns till för att betjäna.\n\nIcke-värdeskapande efterfrågan: efterfrågan orsakad av att något inte har gjorts, eller inte har gjorts rätt — ur kundens perspektiv.',
    de: 'Wertnachfrage: Nachfrage, der die Organisation dienen soll.\n\nFehlernachfrage: Nachfrage, verursacht durch das Versäumnis, etwas oder etwas richtig zu tun — aus Sicht des Kunden.',
  },
  'capture.workTypeLabel': {
    en: 'Work type',
    da: 'Arbejdstype',
    sv: 'Arbetstyp',
    de: 'Arbeitsart',
  },
  'capture.selectWorkType': {
    en: 'Select work type...',
    da: 'Vælg arbejdstype...',
    sv: 'Välj arbetstyp...',
    de: 'Arbeitsart auswählen...',
  },
  'capture.workTypeFreeTextPlaceholder': {
    en: 'Describe the work type...',
    da: 'Beskriv arbejdstypen...',
    sv: 'Beskriv arbetstypen...',
    de: 'Arbeitsart beschreiben...',
  },
  'capture.workVerbatimLabel': {
    en: 'What was the internal request or question?',
    da: 'Hvad var den interne henvendelse eller spørgsmål?',
    sv: 'Vad var den interna förfrågan eller frågan?',
    de: 'Was war die interne Anfrage oder Frage?',
  },
  'capture.workVerbatimPlaceholder': {
    en: 'Describe the internal request or question...',
    da: 'Beskriv den interne henvendelse eller spørgsmål...',
    sv: 'Beskriv den interna förfrågan eller frågan...',
    de: 'Beschreiben Sie die interne Anfrage oder Frage...',
  },
  'capture.saveWork': {
    en: 'Save Work Entry',
    da: 'Gem arbejdsregistrering',
    sv: 'Spara arbetspost',
    de: 'Arbeitseintrag speichern',
  },
  'dashboard.demandVsWork': {
    en: 'Demand vs Work',
    da: 'Efterspørgsel vs. arbejde',
    sv: 'Efterfrågan vs. arbete',
    de: 'Nachfrage vs. Arbeit',
  },
  'dashboard.overview': {
    en: 'Overview',
    da: 'Overblik',
    sv: 'Översikt',
    de: 'Übersicht',
  },
  'dashboard.workTab': {
    en: 'Work',
    da: 'Arbejde',
    sv: 'Arbete',
    de: 'Arbeit',
  },
  'dashboard.demandTab': {
    en: 'Demand',
    da: 'Efterspørgsel',
    sv: 'Efterfrågan',
    de: 'Nachfrage',
  },
  'dashboard.workAnalysis': {
    en: 'Work Analysis',
    da: 'Arbejdsanalyse',
    sv: 'Arbetsanalys',
    de: 'Arbeitsanalyse',
  },
  'dashboard.unknownEntries': {
    en: 'Uncertain (?)',
    da: 'Usikker (?)',
    sv: 'Osäker (?)',
    de: 'Unsicher (?)',
  },
  'dashboard.workEntries': {
    en: 'Work Entries',
    da: 'Arbejdsregistreringer',
    sv: 'Arbetsposter',
    de: 'Arbeitseinträge',
  },
  'dashboard.workTypes': {
    en: 'Work Types',
    da: 'Arbejdstyper',
    sv: 'Arbetstyper',
    de: 'Arbeitsarten',
  },
  'dashboard.valueWork': {
    en: 'Value Work',
    da: 'Værdiskabende arbejde',
    sv: 'Värdeskapande arbete',
    de: 'Wertarbeit',
  },
  'dashboard.failureWork': {
    en: 'Failure Work',
    da: 'Ikke-værdiskabende arbejde',
    sv: 'Icke-värdeskapande arbete',
    de: 'Fehlerarbeit',
  },
  'dashboard.workOverTime': {
    en: 'Work Over Time',
    da: 'Arbejde over tid',
    sv: 'Arbete över tid',
    de: 'Arbeit im Zeitverlauf',
  },
  // Slice 2: type + frequency of failure demand captured inline in flow.
  'dashboard.flowFailureDemand': {
    en: 'Failure demand (captured in flow)',
    da: 'Ikke-værdiskabende efterspørgsel (fanget i flow)',
    sv: 'Icke-värdeskapande efterfrågan (fångad i flöde)',
    de: 'Fehlernachfrage (im Flow erfasst)',
  },
  'dashboard.totalCapacity': {
    en: 'Total Capacity',
    da: 'Total kapacitet',
    sv: 'Total kapacitet',
    de: 'Gesamtkapazität',
  },
  'dashboard.workTypesByClass': {
    en: 'Work Types by Classification',
    da: 'Arbejdstyper efter klassificering',
    sv: 'Arbetstyper efter klassificering',
    de: 'Arbeitsarten nach Klassifizierung',
  },
  'dashboard.failureDemandPct': {
    en: 'Failure Demand',
    da: 'Ikke-værdiskabende efterspørgsel',
    sv: 'Icke-värdeskapande efterfrågan',
    de: 'Fehlernachfrage',
  },
  'dashboard.valueWorkPct': {
    en: 'Value Work',
    da: 'Værdiskabende arbejde',
    sv: 'Värdeskapande arbete',
    de: 'Wertschöpfende Arbeit',
  },
  'dashboard.failureWorkPct': {
    en: 'Failure Work',
    da: 'Ikke-værdiskabende arbejde',
    sv: 'Icke-värdeskapande arbete',
    de: 'Fehlarbeit',
  },
  'dashboard.topFailureCauses': {
    en: 'Top System Conditions',
    da: 'Vigtigste systemforhold',
    sv: 'Viktigaste systemvillkor',
    de: 'Wichtigste Systembedingungen',
  },
  'dashboard.demandWorkRatio': {
    en: 'Demand : Work',
    da: 'Efterspørgsel : Arbejde',
    sv: 'Efterfrågan : Arbete',
    de: 'Nachfrage : Arbeit',
  },
  'dashboard.overviewSummary': {
    en: 'Executive Summary',
    da: 'Resumé',
    sv: 'Sammanfattning',
    de: 'Zusammenfassung',
  },
  'dashboard.demandSplit': {
    en: 'Demand Split',
    da: 'Efterspørgselsfordeling',
    sv: 'Efterfrågefördelning',
    de: 'Nachfrageaufteilung',
  },
  'dashboard.workSplit': {
    en: 'Work Split',
    da: 'Arbejdsfordeling',
    sv: 'Arbetsfördelning',
    de: 'Arbeitsaufteilung',
  },
  'settings.workTypes': {
    en: 'Work Types',
    da: 'Arbejdstyper',
    sv: 'Arbetstyper',
    de: 'Arbeitsarten',
  },
  'settings.workTypesDesc': {
    en: 'Categories for classifying internal work.',
    da: 'Kategorier til klassificering af internt arbejde.',
    sv: 'Kategorier för klassificering av internt arbete.',
    de: 'Kategorien zur Klassifizierung interner Arbeit.',
  },
  'settings.addWorkType': {
    en: 'Add work type...',
    da: 'Tilføj arbejdstype...',
    sv: 'Lägg till arbetstyp...',
    de: 'Arbeitsart hinzufügen...',
  },
  // Phase 4 (2026-04-16) — Work Step Types taxonomy
  'settings.workSteps': {
    en: 'Work Steps',
    da: 'Arbejdstrin',
    sv: 'Arbetssteg',
    de: 'Arbeitsschritte',
  },
  'settings.workStepsDesc': {
    en: 'A managed list of the actual steps inside the Flow — each tagged Value or Failure. When enabled, Flow blocks can pick from this list instead of being free-text, so steps aggregate across entries.',
    da: 'En styret liste over de faktiske trin i forløbet — hver mærket som værdiskabende eller ikke-værdiskabende. Når aktiveret kan forløbsblokke vælges fra denne liste i stedet for at være fritekst, så trin kan aggregeres på tværs af registreringer.',
    sv: 'En hanterad lista över de faktiska stegen i flödet — vart och ett taggat som värdeskapande eller icke-värdeskapande. När aktiverat kan flödesblock väljas från denna lista istället för att vara fritext, så steg kan aggregeras över registreringar.',
    de: 'Eine gepflegte Liste der tatsächlichen Schritte im Ablauf — jeder als Wert oder Fehler markiert. Bei aktivierter Option können Ablaufblöcke aus dieser Liste gewählt werden statt Freitext, damit Schritte über Einträge aggregiert werden können.',
  },
  'settings.enableWorkSteps': {
    en: 'Enable Work Step taxonomy',
    da: 'Aktivér taksonomi for arbejdstrin',
    sv: 'Aktivera taxonomi för arbetssteg',
    de: 'Arbeitsschritt-Taxonomie aktivieren',
  },
  'settings.addWorkStep': {
    en: 'Add work step...',
    da: 'Tilføj arbejdstrin...',
    sv: 'Lägg till arbetssteg...',
    de: 'Arbeitsschritt hinzufügen...',
  },
  // Phase 4B (2026-04-16) — synthesis helper
  'settings.synthesiseWorkSteps': {
    en: 'Synthesise Work Steps from free-text',
    da: 'Syntetiser arbejdstrin fra fritekst',
    sv: 'Syntetisera arbetssteg från fritext',
    de: 'Arbeitsschritte aus Freitext synthetisieren',
  },
  'settings.synthesiseDesc': {
    en: 'Group existing free-text Flow blocks into reusable Work Step Types.',
    da: 'Grupper eksisterende fritekst-forløbsblokke i genanvendelige arbejdstrin.',
    sv: 'Gruppera befintliga fritext-flödesblock till återanvändbara arbetsstegstyper.',
    de: 'Bestehende Freitext-Ablaufblöcke in wiederverwendbare Arbeitsschritte gruppieren.',
  },
  'settings.synthesiseSummary': {
    en: '{orphans} free-text blocks · {clusters} clusters',
    da: '{orphans} fritekstblokke · {clusters} klynger',
    sv: '{orphans} fritextblock · {clusters} kluster',
    de: '{orphans} Freitextblöcke · {clusters} Cluster',
  },
  'settings.synthesiseEmpty': {
    en: 'No free-text blocks to cluster. Great, everything is already using the taxonomy.',
    da: 'Ingen fritekstblokke at klynge. Alt bruger allerede taksonomien.',
    sv: 'Inga fritextblock att klustra. Allt använder redan taxonomin.',
    de: 'Keine Freitextblöcke zum Gruppieren. Alles nutzt bereits die Taxonomie.',
  },
  'settings.promote': {
    en: 'Promote',
    da: 'Forfrem',
    sv: 'Befordra',
    de: 'Übernehmen',
  },
  'settings.dismiss': {
    en: 'Dismiss',
    da: 'Afvis',
    sv: 'Avvisa',
    de: 'Verwerfen',
  },
  'settings.clusterBlockCount': {
    en: '{count} blocks',
    da: '{count} blokke',
    sv: '{count} block',
    de: '{count} Blöcke',
  },
  'settings.close': {
    en: 'Close',
    da: 'Luk',
    sv: 'Stäng',
    de: 'Schließen',
  },
  'settings.systemConditions': {
    en: 'System Conditions',
    da: 'Systemforhold',
    sv: 'Systemvillkor',
    de: 'Systembedingungen',
  },
  'settings.systemConditionsDesc': {
    en: 'Pre-defined system conditions that explain why failure demand occurs. When enabled, collectors select from this list instead of typing free text.',
    da: 'Foruddefinerede systemforhold der forklarer hvorfor ikke-værdiskabende efterspørgsel opstår. Når aktiveret vælger indsamlere fra denne liste i stedet for at skrive fritekst.',
    sv: 'Fördefinierade systemvillkor som förklarar varför icke-värdeskapande efterfrågan uppstår. När aktiverat väljer insamlare från denna lista istället för att skriva fritext.',
    de: 'Vordefinierte Systembedingungen, die erklären, warum Fehlnachfrage entsteht. Wenn aktiviert, wählen Erfasser aus dieser Liste statt Freitext einzugeben.',
  },
  'settings.enableSystemConditions': {
    en: 'Enable managed system conditions',
    da: 'Aktiver styrede systemforhold',
    sv: 'Aktivera hanterade systemvillkor',
    de: 'Verwaltete Systembedingungen aktivieren',
  },
  'settings.addSystemCondition': {
    en: 'Add system condition...',
    da: 'Tilføj systemforhold...',
    sv: 'Lägg till systemvillkor...',
    de: 'Systembedingung hinzufügen...',
  },
  'settings.thinkings': {
    en: 'Thinking',
    da: 'T\u00e6nkning',
    sv: 'T\u00e4nkande',
    de: 'Denken',
  },
  'settings.thinkingsDesc': {
    en: 'The thinking behind system conditions. Collectors tick these when logging a failure — or add new ones on the fly.',
    da: 'T\u00e6nkningen bag systemforholdene. Indsamlere krydser af her n\u00e5r de logger en fejl \u2014 eller tilf\u00f8jer nye p\u00e5 stedet.',
    sv: 'T\u00e4nkandet bakom systemf\u00f6rh\u00e5llandena. Insamlare kryssar i dessa n\u00e4r de loggar ett fel \u2014 eller l\u00e4gger till nya p\u00e5 platsen.',
    de: 'Das Denken hinter den Systembedingungen. Erfasser h\u00e4kchen diese beim Loggen eines Fehlers an \u2014 oder f\u00fcgen neue hinzu.',
  },
  'settings.addThinking': {
    en: 'Add thinking...',
    da: 'Tilf\u00f8j t\u00e6nkning...',
    sv: 'L\u00e4gg till t\u00e4nkande...',
    de: 'Denken hinzuf\u00fcgen...',
  },
  'settings.demandTypes': {
    en: 'Demand Types',
    da: 'Efterspørgselstyper',
    sv: 'Efterfrågetyper',
    de: 'Nachfragearten',
  },
  'settings.demandTypesDesc': {
    en: 'When the team sees natural demand types emerging, enable this to add type classification to the capture form.',
    da: 'Når teamet ser naturlige efterspørgselstyper opstå, aktiver dette for at tilføje typeklassificering til registreringsformularen.',
    sv: 'När teamet ser naturliga efterfrågetyper framträda, aktivera detta för att lägga till typklassificering i registreringsformuläret.',
    de: 'Wenn das Team natürliche Nachfragearten erkennt, aktivieren Sie dies, um die Typklassifizierung zum Erfassungsformular hinzuzufügen.',
  },
  'settings.enableDemandTypes': {
    en: 'Enable demand type classification',
    da: 'Aktiver efterspørgselstypeklassificering',
    sv: 'Aktivera efterfrågetypklassificering',
    de: 'Nachfrageart-Klassifizierung aktivieren',
  },
  'settings.enableWorkTypes': {
    en: 'Enable work type classification',
    da: 'Aktiver arbejdstypeklassificering',
    sv: 'Aktivera arbetstypklassificering',
    de: 'Arbeitstyp-Klassifizierung aktivieren',
  },
  'settings.volumeMode': {
    en: 'Volume Mode',
    da: 'Volumetilstand',
    sv: 'Volymläge',
    de: 'Volumenmodus',
  },
  'settings.volumeModeDesc': {
    en: 'When the study is well-built and it\'s time to gather volume, enable this to hide the verbatim text field. The team will only select types and classifications.',
    da: 'Når studiet er velopbygget og det er tid til at indsamle volumen, aktiver dette for at skjule fritekstfeltet. Teamet vælger kun typer og klassificeringer.',
    sv: 'När studien är väluppbyggd och det är dags att samla volym, aktivera detta för att dölja fritextfältet. Teamet väljer bara typer och klassificeringar.',
    de: 'Wenn die Studie gut aufgebaut ist und es Zeit ist Volumen zu sammeln, aktivieren Sie dies um das Freitextfeld auszublenden. Das Team wählt nur Typen und Klassifizierungen.',
  },
  'settings.enableVolumeMode': {
    en: 'Enable volume mode (hide verbatim)',
    da: 'Aktiver volumetilstand (skjul fritekst)',
    sv: 'Aktivera volymläge (dölj fritext)',
    de: 'Volumenmodus aktivieren (Freitext ausblenden)',
  },

  // Consultant PIN
  'landing.consultantPin': {
    en: 'Consultant PIN',
    da: 'Konsulent-PIN',
    sv: 'Konsult-PIN',
    de: 'Berater-PIN',
  },
  'landing.consultantPinPlaceholder': {
    en: 'Set a 4-6 digit PIN for settings access',
    da: 'Angiv en 4-6 cifret PIN til adgang til indstillinger',
    sv: 'Ange en 4-6 siffrig PIN för åtkomst till inställningar',
    de: 'Legen Sie eine 4-6-stellige PIN für den Zugang zu Einstellungen fest',
  },
  'consultant.enterPin': {
    en: 'Enter consultant PIN',
    da: 'Indtast konsulent-PIN',
    sv: 'Ange konsult-PIN',
    de: 'Berater-PIN eingeben',
  },
  'consultant.wrongPin': {
    en: 'Incorrect PIN',
    da: 'Forkert PIN',
    sv: 'Felaktig PIN',
    de: 'Falsche PIN',
  },
  'consultant.unlock': {
    en: 'Unlock',
    da: 'Lås op',
    sv: 'Lås upp',
    de: 'Entsperren',
  },
  'consultant.setPin': {
    en: 'Set consultant PIN',
    da: 'Angiv konsulent-PIN',
    sv: 'Ange konsult-PIN',
    de: 'Berater-PIN festlegen',
  },
  'consultant.setPinDesc': {
    en: 'A PIN is required to access settings and manage layers. Set one now.',
    da: 'En PIN er påkrævet for at få adgang til indstillinger og administrere lag. Angiv en nu.',
    sv: 'En PIN krävs för åtkomst till inställningar och lagerhantering. Ange en nu.',
    de: 'Zum Zugriff auf Einstellungen und Schichten wird eine PIN benötigt. Jetzt festlegen.',
  },

  // Layer system
  'layers.title': {
    en: 'Analysis Layers',
    da: 'Analyselag',
    sv: 'Analyslager',
    de: 'Analyseschichten',
  },
  'layers.current': {
    en: 'Current layer',
    da: 'Nuværende lag',
    sv: 'Nuvarande lager',
    de: 'Aktuelle Schicht',
  },
  'layers.activate': {
    en: 'Activate Layer {layer}',
    da: 'Aktivér lag {layer}',
    sv: 'Aktivera lager {layer}',
    de: 'Schicht {layer} aktivieren',
  },
  'layers.activateConfirm': {
    en: 'This will add new fields to the capture form and require reclassification of existing demands. Continue?',
    da: 'Dette tilføjer nye felter til indsamlingsformularen og kræver omklassificering af eksisterende efterspørgsler. Fortsæt?',
    sv: 'Detta lägger till nya fält i insamlingsformuläret och kräver omklassificering av befintliga efterfrågningar. Fortsätt?',
    de: 'Dadurch werden neue Felder zum Erfassungsformular hinzugefügt und eine Neuklassifizierung bestehender Nachfragen erforderlich. Fortfahren?',
  },
  'layers.allActive': {
    en: 'All layers active',
    da: 'Alle lag er aktive',
    sv: 'Alla lager aktiva',
    de: 'Alle Schichten aktiv',
  },
  'layers.prereq2': {
    en: 'Ready to activate: practitioners will classify each demand as Value or Failure',
    da: 'Klar til aktivering: medarbejdere vil klassificere hver efterspørgsel som Værdi eller Fejl',
    sv: 'Redo att aktivera: medarbetare kommer att klassificera varje efterfrågan som Värde eller Icke-värde',
    de: 'Bereit zur Aktivierung: Mitarbeiter werden jede Nachfrage als Wert oder Fehler klassifizieren',
  },
  'layers.prereq3': {
    en: 'Before activating: define at least one capability of response below',
    da: 'Før aktivering: definer mindst én reaktionskapacitet nedenfor',
    sv: 'Före aktivering: definiera minst en reaktionsförmåga nedan',
    de: 'Vor Aktivierung: definieren Sie mindestens eine Reaktionsfähigkeit unten',
  },
  'layers.prereq4': {
    en: 'Before activating: ensure failure demand types are configured with original value demand links',
    da: 'Før aktivering: sørg for at ikke-værdiskabende efterspørgselstyper er konfigureret med links til oprindelig værdiskabende efterspørgsel',
    sv: 'Före aktivering: se till att icke-värdeskapande efterfrågetyper är konfigurerade med länkar till ursprunglig värdeskapande efterfrågan',
    de: 'Vor Aktivierung: stellen Sie sicher, dass Fehler-Nachfragearten mit Links zur ursprünglichen Wert-Nachfrage konfiguriert sind',
  },
  'layers.prereq5': {
    en: 'Before activating: define at least one "what matters" category below',
    da: 'Før aktivering: definer mindst én "det der betyder noget"-kategori nedenfor',
    sv: 'Före aktivering: definiera minst en "det som betyder något"-kategori nedan',
    de: 'Vor Aktivierung: definieren Sie mindestens eine "was wichtig ist"-Kategorie unten',
  },
  'layers.guidanceTitle': {
    en: 'What changes when you activate Layer {layer}',
    da: 'Hvad ændrer sig når du aktiverer lag {layer}',
    sv: 'Vad ändras när du aktiverar lager {layer}',
    de: 'Was ändert sich wenn Sie Schicht {layer} aktivieren',
  },
  'layers.guidance2': {
    en: 'Practitioners will classify each demand as Value or Failure. Existing entries will need reclassification. Demand types can be enabled separately when the team sees types emerging.',
    da: 'Medarbejdere vil klassificere hver efterspørgsel som Værdi eller Fejl. Eksisterende registreringer skal omklassificeres. Efterspørgselstyper kan aktiveres separat når teamet ser typer opstå.',
    sv: 'Medarbetare kommer att klassificera varje efterfrågan som Värde eller Icke-värde. Befintliga poster behöver omklassificeras. Efterfrågetyper kan aktiveras separat när teamet ser typer framträda.',
    de: 'Mitarbeiter werden jede Nachfrage als Wert oder Fehler klassifizieren. Bestehende Einträge müssen neu klassifiziert werden. Nachfragearten können separat aktiviert werden wenn das Team Typen erkennt.',
  },
  'layers.guidance3': {
    en: 'Practitioners will record how each demand was handled (e.g. one-stop, pass-on). This reveals how the system responds to demand.',
    da: 'Medarbejdere registrerer hvordan hver efterspørgsel blev håndteret (f.eks. one-stop, sendt videre). Dette afslører hvordan systemet reagerer på efterspørgsel.',
    sv: 'Medarbetare registrerar hur varje efterfrågan hanterades (t.ex. one-stop, vidarebefordrad). Detta avslöjar hur systemet svarar på efterfrågan.',
    de: 'Mitarbeiter erfassen wie jede Nachfrage bearbeitet wurde (z.B. One-Stop, Weiterleitung). Dies zeigt wie das System auf Nachfrage reagiert.',
  },
  'layers.guidance4': {
    en: 'Failure demands will be linked back to the original value demand they stem from. This reveals which value demands generate the most failure.',
    da: 'Ikke-værdiskabende efterspørgsler kobles tilbage til den oprindelige værdiskabende efterspørgsel, de stammer fra. Dette afslører, hvilke værdiskabende efterspørgsler der genererer mest ikke-værdiskabende efterspørgsel.',
    sv: 'Icke-värdeskapande efterfrågan kopplas tillbaka till den ursprungliga värdeskapande efterfrågan. Detta avslöjar vilka värdeskapande efterfrågor som genererar mest icke-värdeskapande efterfrågan.',
    de: 'Fehlernachfragen werden mit der ursprünglichen Wertnachfrage verknüpft. Dies zeigt welche Wertnachfragen die meisten Fehler erzeugen.',
  },
  'layers.guidance5': {
    en: 'Full analysis with all fields active. Practitioners can now capture what matters to the customer for each demand.',
    da: 'Fuld analyse med alle felter aktive. Medarbejdere kan nu registrere hvad der betyder noget for kunden ved hver efterspørgsel.',
    sv: 'Full analys med alla fält aktiva. Medarbetare kan nu registrera vad som betyder något för kunden vid varje efterfrågan.',
    de: 'Vollständige Analyse mit allen Feldern aktiv. Mitarbeiter können nun erfassen was dem Kunden bei jeder Nachfrage wichtig ist.',
  },
  'layers.description1': {
    en: 'Raw demand + what matters',
    da: 'Rå efterspørgsel + hvad der betyder noget',
    sv: 'Rå efterfrågan + vad som är viktigt',
    de: 'Rohe Nachfrage + was wichtig ist',
  },
  'layers.description2': {
    en: 'Value / failure classification',
    da: 'Værdi-/fejlklassificering',
    sv: 'Värde-/felklassificering',
    de: 'Wert-/Fehlerklassifizierung',
  },
  'layers.description3': {
    en: 'Capability of response (how the system can respond to demand)',
    da: 'Reaktionskapacitet (hvordan systemet kan reagere på efterspørgsel)',
    sv: 'Reaktionsförmåga (hur systemet kan svara på efterfrågan)',
    de: 'Reaktionsfähigkeit (wie das System auf Nachfrage reagieren kann)',
  },
  'layers.description4': {
    en: 'Linked demands (failure to value)',
    da: 'Sammenkædede efterspørgsler (fejl til værdi)',
    sv: 'Länkade efterfrågningar (fel till värde)',
    de: 'Verknüpfte Nachfragen (Fehler zu Wert)',
  },
  'layers.description5': {
    en: 'Split what matters by demand type',
    da: 'Opdel hvad der betyder noget efter efterspørgselstype',
    sv: 'Dela upp vad som är viktigt per efterfrågetyp',
    de: 'Was wichtig ist nach Nachfragetyp aufteilen',
  },

  // Navigation
  'nav.reclassify': {
    en: 'Reclassify',
    da: 'Omklassificér',
    sv: 'Omklassificera',
    de: 'Neuklassifizieren',
  },

  // Reclassification
  'reclassify.title': {
    en: 'Reclassify Demands',
    da: 'Omklassificér efterspørgsler',
    sv: 'Omklassificera efterfrågningar',
    de: 'Nachfragen neuklassifizieren',
  },
  'reclassify.remaining': {
    en: '{current} of {total} remaining',
    da: '{current} af {total} tilbage',
    sv: '{current} av {total} kvar',
    de: '{current} von {total} übrig',
  },
  'reclassify.saveNext': {
    en: 'Save & Next',
    da: 'Gem & næste',
    sv: 'Spara & nästa',
    de: 'Speichern & weiter',
  },
  'reclassify.skip': {
    en: 'Skip',
    da: 'Spring over',
    sv: 'Hoppa över',
    de: 'Überspringen',
  },
  'reclassify.complete': {
    en: 'All caught up — no demands need reclassifying right now.',
    da: 'Alt er opdateret — ingen efterspørgsler skal omklassificeres lige nu.',
    sv: 'Allt är uppdaterat — inga efterfrågningar behöver omklassificeras just nu.',
    de: 'Alles erledigt — keine Nachfragen müssen gerade neuklassifiziert werden.',
  },
  'reclassify.layerLabel': {
    en: 'Layer {layer}',
    da: 'Lag {layer}',
    sv: 'Lager {layer}',
    de: 'Schicht {layer}',
  },
  'reclassify.layerGuide2': {
    en: 'Classify each demand as value or failure. Value demand is what customers actually want. Failure demand is caused by a failure to do something or do something right for the customer.',
    da: 'Klassificér hver efterspørgsel som værdiskabende eller ikke-værdiskabende. Værdiskabende efterspørgsel er det kunden faktisk ønsker. Ikke-værdiskabende efterspørgsel er forårsaget af, at noget ikke er gjort eller ikke er gjort rigtigt for kunden.',
    sv: 'Klassificera varje efterfrågan som värdeskapande eller icke-värdeskapande. Värdeskapande efterfrågan är det kunden faktiskt vill ha. Icke-värdeskapande efterfrågan orsakas av att något inte har gjorts eller inte har gjorts rätt för kunden.',
    de: 'Klassifizieren Sie jede Nachfrage als Wert oder Fehler. Wertnachfrage ist das, was Kunden tatsächlich wollen. Fehlernachfrage wird durch ein Versagen verursacht, etwas zu tun oder richtig zu tun.',
  },
  'reclassify.layerGuide3': {
    en: 'Select how each demand was handled. This helps understand the system\'s response to customer demand.',
    da: 'Vælg hvordan hver efterspørgsel blev håndteret. Dette hjælper med at forstå systemets reaktion på kundeefterspørgsel.',
    sv: 'Välj hur varje efterfrågan hanterades. Detta hjälper till att förstå systemets svar på kundefterfrågan.',
    de: 'Wählen Sie, wie jede Nachfrage bearbeitet wurde. Dies hilft, die Reaktion des Systems auf Kundennachfrage zu verstehen.',
  },
  'reclassify.layerGuide4': {
    en: 'Link each failure demand to the original value demand it relates to. This reveals which value demands are generating the most failure.',
    da: 'Forbind hver ikke-værdiskabende efterspørgsel med den oprindelige værdiskabende efterspørgsel, den relaterer til. Dette afslører, hvilke værdiskabende efterspørgsler der genererer mest ikke-værdiskabende efterspørgsel.',
    sv: 'Koppla varje icke-värdeskapande efterfrågan till den ursprungliga värdeskapande efterfrågan den relaterar till. Detta avslöjar vilka värdeskapande efterfrågor som genererar mest icke-värdeskapande efterfrågan.',
    de: 'Verknüpfen Sie jede Fehlernachfrage mit der ursprünglichen Wertnachfrage. Dies zeigt, welche Wertnachfragen die meisten Fehler verursachen.',
  },
  'reclassify.layerNotActive': {
    en: 'Classification is not yet active for this study. Activate Layer 2 in Settings to begin.',
    da: 'Klassificering er endnu ikke aktiveret for dette studie. Aktivér Lag 2 i Indstillinger for at begynde.',
    sv: 'Klassificering är ännu inte aktiverad för denna studie. Aktivera Lager 2 i Inställningar för att börja.',
    de: 'Die Klassifizierung ist für diese Studie noch nicht aktiviert. Aktivieren Sie Schicht 2 in den Einstellungen, um zu beginnen.',
  },
  'reclassify.classifyAs': {
    en: 'Classify this demand as value or failure:',
    da: 'Klassificér denne efterspørgsel som værdi eller fejl:',
    sv: 'Klassificera denna efterfrågan som värde eller fel:',
    de: 'Klassifizieren Sie diese Nachfrage als Wert oder Fehler:',
  },
  'reclassify.selectHandling': {
    en: 'What was the capability of response to this demand?',
    da: 'Hvad var reaktionskapaciteten over for denne efterspørgsel?',
    sv: 'Vad var reaktionsförmågan på denna efterfrågan?',
    de: 'Was war die Reaktionsfähigkeit auf diese Nachfrage?',
  },
  'reclassify.linkToValue': {
    en: 'Which value demand did this failure originate from?',
    da: 'Hvilken værdiskabende efterspørgsel opstod denne ikke-værdiskabende efterspørgsel fra?',
    sv: 'Vilken värdeskapande efterfrågan härstammade denna icke-värdeskapande efterfrågan från?',
    de: 'Von welcher Wertnachfrage stammt dieser Fehler?',
  },
  'reclassify.editMoreFields': {
    en: 'Edit more fields',
    da: 'Rediger flere felter',
    sv: 'Redigera fler fält',
    de: 'Weitere Felder bearbeiten',
  },
  'reclassify.editEntry': {
    en: 'Edit entry',
    da: 'Rediger efterspørgsel',
    sv: 'Redigera efterfrågan',
    de: 'Nachfrage bearbeiten',
  },
  'dashboard.editEntry': {
    en: 'Edit',
    da: 'Rediger',
    sv: 'Redigera',
    de: 'Bearbeiten',
  },

  // Capture form - what matters multi-select
  'capture.whatMattersSelect': {
    en: 'What matters (select all that apply)',
    da: 'Hvad betyder noget (vælg alle der gælder)',
    sv: 'Vad är viktigt (välj alla som gäller)',
    de: 'Was wichtig ist (alle zutreffenden auswählen)',
  },
  'capture.addWhatMatters': {
    en: '+ What matters',
    da: '+ Hvad betyder noget',
    sv: '+ Vad är viktigt',
    de: '+ Was wichtig ist',
  },
  'capture.whatMattersWhenLabel': {
    en: 'When do you want it?',
    da: 'Hvornår vil du have det?',
    sv: 'När vill du ha det?',
    de: 'Wann möchten Sie es?',
  },
  'capture.whatMattersAsapHint': {
    en: 'from case open',
    da: 'fra sagen åbnes',
    sv: 'från att ärendet öppnas',
    de: 'ab Fallöffnung',
  },
  'capture.addLifeProblem': {
    en: '+ Life problem to be solved',
    da: '+ Livsproblem der skal løses',
    sv: '+ Livsproblem som ska lösas',
    de: '+ Zu lösendes Lebensproblem',
  },
  'capture.typeInWhatMattersPlaceholder': {
    en: 'Type in what matters',
    da: 'Skriv hvad der betyder noget',
    sv: 'Skriv vad som är viktigt',
    de: 'Was wichtig ist eingeben',
  },
  'capture.typeInLifeProblemPlaceholder': {
    en: 'Type in life problem to be solved',
    da: 'Skriv livsproblem der skal løses',
    sv: 'Skriv livsproblem som ska lösas',
    de: 'Zu lösendes Lebensproblem eingeben',
  },
  'capture.typeInSystemConditionPlaceholder': {
    en: 'Type in new system condition',
    da: 'Skriv nyt systemforhold',
    sv: 'Skriv nytt systemvillkor',
    de: 'Neue Systembedingung eingeben',
  },
  'capture.typeInThinkingPlaceholder': {
    en: 'Type in thinking that explains the system conditions',
    da: 'Skriv tænkning der forklarer systemforholdene',
    sv: 'Skriv tänkande som förklarar systemvillkoren',
    de: 'Denken eingeben, das die Systembedingungen erklärt',
  },
  // Vanguard strand labels — subtle section dividers on the capture form.
  'capture.strand.demand': {
    en: 'Demand',
    da: 'Efterspørgsel',
    sv: 'Efterfrågan',
    de: 'Nachfrage',
  },
  'capture.strand.work': {
    en: 'Work',
    da: 'Arbejde',
    sv: 'Arbete',
    de: 'Arbeit',
  },
  'capture.strand.response': {
    en: 'Capability of Response (COR)',
    da: 'Reaktionskapacitet (COR)',
    sv: 'Reaktionsförmåga (COR)',
    de: 'Reaktionsfähigkeit (COR)',
  },
  'capture.strand.flow': {
    en: 'Flow: Capacity = value work + failure work',
    da: 'Flow: Kapacitet = værdiskabende arbejde + ikke-værdiskabende arbejde',
    sv: 'Flöde: Kapacitet = värdeskapande arbete + icke-värdeskapande arbete',
    de: 'Fluss: Kapazität = Wertarbeit + Fehlerarbeit',
  },
  'capture.strand.system': {
    en: 'System',
    da: 'System',
    sv: 'System',
    de: 'System',
  },
  'capture.strand.thinking': {
    en: 'Thinking',
    da: 'Tænkning',
    sv: 'Tänkande',
    de: 'Denken',
  },
  // Short section headers inside a saved-touch card (2026-06-18) — sized like the
  // flow separator. Short forms so they fit the narrow card.
  'capture.touchSecConditions': {
    en: 'Conditions',
    da: 'Forhold',
    sv: 'Villkor',
    de: 'Bedingungen',
  },
  'capture.touchSecSteps': {
    en: 'Steps',
    da: 'Trin',
    sv: 'Steg',
    de: 'Schritte',
  },
  'capture.touchSecCor': {
    en: 'CoR',
    da: 'CoR',
    sv: 'CoR',
    de: 'CoR',
  },
  'capture.typeInOriginalValueDemandPlaceholder': {
    en: 'Type in new value demand',
    da: 'Skriv ny værdiskabende efterspørgsel',
    sv: 'Skriv ny värdeskapande efterfrågan',
    de: 'Neue Wertnachfrage eingeben',
  },
  'capture.typeInHandlingPlaceholder': {
    en: 'Type in new capability of response',
    da: 'Skriv ny reaktionskapacitet',
    sv: 'Skriv ny reaktionsförmåga',
    de: 'Neue Reaktionsfähigkeit eingeben',
  },
  'capture.addHandlingButton': {
    en: '+ COR',
    da: '+ COR',
    sv: '+ COR',
    de: '+ COR',
  },
  // Capture form - linked demand
  'capture.linkedValueDemand': {
    en: 'Link to originating value demand',
    da: 'Kobl til den oprindelige værdiskabende efterspørgsel',
    sv: 'Länka till ursprunglig värdeskapande efterfrågan',
    de: 'Mit ursprünglicher Wertnachfrage verknüpfen',
  },
  'capture.searchValueDemands': {
    en: 'Search value demands...',
    da: 'Søg værdiskabende efterspørgsler...',
    sv: 'Sök värdeskapande efterfrågor...',
    de: 'Wertnachfragen suchen...',
  },

  // Capture form - inline type creation & search
  'capture.addNew': {
    en: 'Add new',
    da: 'Tilføj ny',
    sv: 'Lägg till ny',
    de: 'Neu hinzufügen',
  },
  'capture.edit': {
    en: 'Edit',
    da: 'Rediger',
    sv: 'Redigera',
    de: 'Bearbeiten',
  },
  'capture.showMore': {
    en: 'Show more',
    da: 'Vis flere',
    sv: 'Visa fler',
    de: 'Mehr anzeigen',
  },
  'capture.entriesListTitle': {
    en: 'Entries',
    da: 'Registreringer',
    sv: 'Poster',
    de: 'Einträge',
  },
  'capture.filterAll': {
    en: 'All',
    da: 'Alle',
    sv: 'Alla',
    de: 'Alle',
  },
  'capture.filterNeedsClassification': {
    en: 'Needs classification',
    da: 'Mangler klassificering',
    sv: 'Behöver klassificering',
    de: 'Klassifizierung fehlt',
  },
  'capture.filterNeedsHandling': {
    en: 'Needs capability of response',
    da: 'Mangler reaktionskapacitet',
    sv: 'Behöver reaktionsförmåga',
    de: 'Reaktionsfähigkeit fehlt',
  },
  'capture.filterNeedsValueLink': {
    en: 'Needs value link',
    da: 'Mangler værdikobling',
    sv: 'Behöver värdelänk',
    de: 'Wertverknüpfung fehlt',
  },
  'capture.toggles.title': {
    en: 'What are we capturing?',
    da: 'Hvad registrerer vi?',
    sv: 'Vad registrerar vi?',
    de: 'Was erfassen wir?',
  },
  'capture.moreDetails': {
    en: 'More details',
    da: 'Flere detaljer',
    sv: 'Mer detaljer',
    de: 'Weitere Details',
  },
  'capture.editName': {
    en: 'Change name',
    da: 'Skift navn',
    sv: 'Byt namn',
    de: 'Name ändern',
  },
  'capture.entriesSheetTrigger': {
    en: 'Entries',
    da: 'Registreringer',
    sv: 'Poster',
    de: 'Einträge',
  },
  'capture.toggles.desc': {
    en: 'Turn on what\u2019s useful. Change anytime.',
    da: 'Slå til hvad der er nyttigt. Ret når som helst.',
    sv: 'Slå på det som är användbart. Ändra när som helst.',
    de: 'Aktiviere, was nützlich ist. Jederzeit änderbar.',
  },
  'capture.toggles.classification': {
    en: 'Classify as value / failure',
    da: 'Klassificer som værdi / fejl',
    sv: 'Klassificera som värde / fel',
    de: 'Als Wert / Fehler klassifizieren',
  },
  'capture.toggles.handling': {
    en: 'Capture capability of response',
    da: 'Registrer reaktionskapacitet',
    sv: 'Registrera reaktionsförmåga',
    de: 'Reaktionsfähigkeit erfassen',
  },
  'capture.toggles.valueLinking': {
    en: 'Link failure demand to underlying value demand',
    da: 'Kobl ikke-værdiskabende efterspørgsel til underliggende værdiskabende efterspørgsel',
    sv: 'Koppla icke-värdeskapande efterfrågan till underliggande värdeskapande efterfrågan',
    de: 'Fehlbedarf mit zugrunde liegendem Wertbedarf verknüpfen',
  },
  'capture.toggles.systemConditions': {
    en: 'Capture system conditions',
    da: 'Registrer systemforhold',
    sv: 'Registrera systemvillkor',
    de: 'Systembedingungen erfassen',
  },
  'capture.toggles.demandTypes': {
    en: 'Capture demand types',
    da: 'Registrer efterspørgselstyper',
    sv: 'Registrera efterfrågetyper',
    de: 'Nachfragetypen erfassen',
  },
  'capture.toggles.work': {
    en: 'Capture work',
    da: 'Registrer arbejde',
    sv: 'Registrera arbete',
    de: 'Arbeit erfassen',
  },
  'capture.toggles.workTypes': {
    en: 'Capture work types',
    da: 'Registrer arbejdstyper',
    sv: 'Registrera arbetstyper',
    de: 'Arbeitstypen erfassen',
  },
  'capture.toggles.flowDemand': {
    en: 'Capture flow (demand)',
    da: 'Registrer flow (efterspørgsel)',
    sv: 'Registrera flöde (efterfrågan)',
    de: 'Fluss erfassen (Nachfrage)',
  },
  'capture.toggles.flowWork': {
    en: 'Capture flow (work)',
    da: 'Registrer flow (arbejde)',
    sv: 'Registrera flöde (arbete)',
    de: 'Fluss erfassen (Arbeit)',
  },
  'capture.toggles.workSources': {
    en: 'Capture work source',
    da: 'Registrer arbejdskilde',
    sv: 'Registrera arbetskälla',
    de: 'Arbeitsquelle erfassen',
  },
  // Case stitching (Skipton slice 1, 2026-06-11). DA/SV value-demand wording
  // follows the canonical glossary (værdiskabende efterspørgsel /
  // värdeskapande efterfrågan); DE stays neutral — no DE canon yet.
  'capture.toggles.caseTracking': {
    en: 'Capture case reference',
    da: 'Registrer sagsreference',
    sv: 'Registrera ärendereferens',
    de: 'Fallreferenz erfassen',
  },
  'capture.caseRefPlaceholder': {
    en: 'Case ref (number only)',
    da: 'Sagsreference (kun nummer)',
    sv: 'Ärendereferens (endast nummer)',
    de: 'Fallreferenz (nur Nummer)',
  },
  'capture.caseRefHelp': {
    en: 'One case reference = one customer = one value demand. Several collectors can add entries to the same case over time — type the same reference to pick the case up where it left off. Privacy: use the reference number only, never a name.',
    da: 'Én sagsreference = én kunde = én værdiskabende efterspørgsel. Flere indsamlere kan tilføje registreringer til samme sag over tid — skriv den samme reference for at fortsætte, hvor sagen slap. Privatliv: brug kun referencenummeret, aldrig et navn.',
    sv: 'En ärendereferens = en kund = en värdeskapande efterfrågan. Flera insamlare kan lägga till registreringar i samma ärende över tid — skriv samma referens för att plocka upp ärendet där det slutade. Integritet: använd endast referensnumret, aldrig ett namn.',
    de: 'Eine Fallreferenz = ein Kunde = ein Anliegen. Mehrere Personen können demselben Fall über die Zeit Einträge hinzufügen — dieselbe Referenz eingeben, um den Fall weiterzuführen. Datenschutz: nur die Referenznummer verwenden, niemals einen Namen.',
  },
  'capture.caseOpenBtn': {
    en: 'Open case',
    da: 'Åbn sag',
    sv: 'Öppna ärende',
    de: 'Fall öffnen',
  },
  'capture.caseStatusOpen': {
    en: 'Open',
    da: 'Åben',
    sv: 'Öppet',
    de: 'Offen',
  },
  'capture.caseStatusClosed': {
    en: 'Closed',
    da: 'Lukket',
    sv: 'Avslutat',
    de: 'Geschlossen',
  },
  'capture.caseCloseBtn': {
    en: 'Close case',
    da: 'Luk sag',
    sv: 'Avsluta ärende',
    de: 'Fall schließen',
  },
  'capture.caseReopenBtn': {
    en: 'Reopen',
    da: 'Genåbn',
    sv: 'Återöppna',
    de: 'Wieder öffnen',
  },
  'capture.caseOpenedAt': {
    en: 'Opened',
    da: 'Åbnet',
    sv: 'Öppnat',
    de: 'Eröffnet',
  },
  'capture.caseDemandTypePlaceholder': {
    en: 'Which value demand is this case?',
    da: 'Hvilken værdiskabende efterspørgsel er sagen?',
    sv: 'Vilken värdeskapande efterfrågan är ärendet?',
    de: 'Welches Anliegen betrifft dieser Fall?',
  },
  'capture.caseTimelineEmpty': {
    en: 'No touches yet — the first saved entry starts the timeline.',
    da: 'Ingen berøringer endnu — den første gemte registrering starter tidslinjen.',
    sv: 'Inga kontakter ännu — den första sparade registreringen startar tidslinjen.',
    de: 'Noch keine Einträge — der erste gespeicherte Eintrag startet den Verlauf.',
  },
  'capture.caseAttachNote': {
    en: 'New entries attach to this case.',
    da: 'Nye registreringer knyttes til denne sag.',
    sv: 'Nya registreringar kopplas till detta ärende.',
    de: 'Neue Einträge werden diesem Fall zugeordnet.',
  },
  'capture.caseSetAside': {
    en: 'Set aside',
    da: 'Læg til side',
    sv: 'Lägg åt sidan',
    de: 'Zur Seite legen',
  },
  'capture.caseNotFound': {
    en: 'Could not open the case. Try again.',
    da: 'Sagen kunne ikke åbnes. Prøv igen.',
    sv: 'Ärendet kunde inte öppnas. Försök igen.',
    de: 'Der Fall konnte nicht geöffnet werden. Bitte erneut versuchen.',
  },
  'reclassify.caseLabel': {
    en: 'Case',
    da: 'Sag',
    sv: 'Ärende',
    de: 'Fall',
  },
  // System type (2026-06-11): the two ways in. DA/SV use canonical
  // value-demand wording; DE stays neutral (no canon).
  'create.systemTypeLabel': {
    en: 'What kind of system are you studying?',
    da: 'Hvilken slags system undersøger du?',
    sv: 'Vilket slags system studerar du?',
    de: 'Welche Art von System untersuchen Sie?',
  },
  'create.systemTypeTransactional': {
    en: 'Transactional',
    da: 'Transaktionsbaseret',
    sv: 'Transaktionsbaserat',
    de: 'Transaktionsbasiert',
  },
  'create.systemTypeTransactionalDesc': {
    en: 'Demand arrives, is captured as one entry, and is handled — each capture is complete in itself.',
    da: 'Efterspørgslen kommer ind, registreres som én registrering og håndteres — hver registrering er komplet i sig selv.',
    sv: 'Efterfrågan kommer in, registreras som en registrering och hanteras — varje registrering är komplett i sig.',
    de: 'Ein Anliegen kommt herein, wird als ein Eintrag erfasst und bearbeitet — jede Erfassung ist in sich abgeschlossen.',
  },
  'create.systemTypeFlow': {
    en: 'Flow-based',
    da: 'Flowbaseret',
    sv: 'Flödesbaserat',
    de: 'Flussbasiert',
  },
  'create.systemTypeFlowDesc': {
    en: 'A value demand opens a case. Work continues across handoffs and returns over time, stitched together by a case reference.',
    da: 'En værdiskabende efterspørgsel åbner en sag. Arbejdet fortsætter på tværs af overleveringer og tilbageløb over tid, holdt sammen af en sagsreference.',
    sv: 'En värdeskapande efterfrågan öppnar ett ärende. Arbetet fortsätter över överlämningar och återkomster över tid, sammanhållet av en ärendereferens.',
    de: 'Ein Anliegen öffnet einen Fall. Die Arbeit läuft über Übergaben und Rückläufe hinweg weiter, verbunden durch eine Fallreferenz.',
  },
  'settings.systemTypeTitle': {
    en: 'System type',
    da: 'Systemtype',
    sv: 'Systemtyp',
    de: 'Systemtyp',
  },
  'settings.dashboardFeaturesTitle': {
    en: 'Dashboard features',
    da: 'Dashboard-funktioner',
    sv: 'Dashboardfunktioner',
    de: 'Dashboard-Funktionen',
  },
  'settings.dashboardFeaturesDesc': {
    en: 'Optional analysis views on the dashboard for this flow.',
    da: 'Valgfrie analysevisninger på dashboardet for dette flow.',
    sv: 'Valfria analysvyer på dashboarden för detta flöde.',
    de: 'Optionale Analyseansichten im Dashboard für diesen Flow.',
  },
  'settings.systemTypeDesc': {
    en: 'How the capture page is shaped. Flow-based leads with the case; transactional captures complete entries one by one. Switching never deletes anything.',
    da: 'Hvordan registreringssiden er formet. Flowbaseret tager udgangspunkt i sagen; transaktionsbaseret registrerer komplette registreringer én ad gangen. Et skift sletter aldrig noget.',
    sv: 'Hur registreringssidan är formad. Flödesbaserat utgår från ärendet; transaktionsbaserat registrerar kompletta registreringar en i taget. Ett byte raderar aldrig något.',
    de: 'Wie die Erfassungsseite aufgebaut ist. Flussbasiert geht vom Fall aus; transaktionsbasiert erfasst vollständige Einträge einzeln. Ein Wechsel löscht nie etwas.',
  },
  'settings.systemTypeConfirmFlow': {
    en: 'Switching to flow-based also turns on case tracking and the flow strands (nothing is turned off). Continue?',
    da: 'Skift til flowbaseret slår også sagsregistrering og flow-elementerne til (intet slås fra). Fortsæt?',
    sv: 'Byte till flödesbaserat slår också på ärenderegistrering och flödesdelarna (inget stängs av). Fortsätt?',
    de: 'Der Wechsel zu flussbasiert aktiviert auch Fallerfassung und Fluss-Elemente (nichts wird deaktiviert). Fortfahren?',
  },
  // Flow-mode case context (slice B). "Context & situation" is wireframe
  // language, not Vanguard canon — plain words. P2BS and What Matters reuse
  // the existing canonical capture.* keys.
  'capture.caseContextPlaceholder': {
    en: 'Context & situation — what is going on around this person?',
    da: 'Kontekst & situation — hvad foregår der omkring personen?',
    sv: 'Kontext & situation — vad pågår runt personen?',
    de: 'Kontext & Situation — was geht rund um diese Person vor?',
  },
  // Flow composer (2026-06-12): the Demand/Work tabs collapse into one
  // segmented control; failure/sequence actions get the lean SC question.
  // DA systemforhold / SV systemvillkor per canonical glossary; DE neutral.
  // Decision points â the Skipton dotted box (2026-06-12). "Clean/dirty"
  // is Skipton-derived Vanguard vocabulary from the requirements note.
  'capture.toggles.decisionPoints': {
    en: 'Capture decision points',
    da: 'Registrer beslutningspunkter',
    sv: 'Registrera beslutspunkter',
    de: 'Entscheidungspunkte erfassen',
  },
  'capture.dpClean': {
    en: 'Clean',
    da: 'Rent',
    sv: 'Rent',
    de: 'Sauber',
  },
  'capture.dpDirty': {
    en: 'Dirty',
    da: 'Urent',
    sv: 'Orent',
    de: 'Unsauber',
  },
  // C9 (2026-06-17): person-decision affordability sub-states. Plain terms,
  // written natively (not Vanguard-glossary concepts).
  'capture.dpWillingnessToPay': {
    en: 'Willingness to pay',
    da: 'Vilje til at betale',
    sv: 'Vilja att betala',
    de: 'Zahlungsbereitschaft',
  },
  'capture.dpAbilityToPay': {
    en: 'Ability to pay',
    da: 'Evne til at betale',
    sv: 'Förmåga att betala',
    de: 'Zahlungsfähigkeit',
  },
  'capture.dpYes': {
    en: 'Yes',
    da: 'Ja',
    sv: 'Ja',
    de: 'Ja',
  },
  'capture.dpNo': {
    en: 'No',
    da: 'Nej',
    sv: 'Nej',
    de: 'Nein',
  },
  'capture.dpCleanlinessAria': {
    en: 'Was this decision reached cleanly or dirtily?',
    da: 'Blev beslutningen nået rent eller urent?',
    sv: 'Nåddes beslutet rent eller orent?',
    de: 'Wurde die Entscheidung sauber oder unsauber erreicht?',
  },
  'capture.dpDirtyCausePlaceholder': {
    en: 'What made it dirty?',
    da: 'Hvad gjorde den uren?',
    sv: 'Vad gjorde det orent?',
    de: 'Was machte sie unsauber?',
  },
  'capture.dpDecidedAtLabel': {
    en: 'Decided',
    da: 'Besluttet',
    sv: 'Beslutat',
    de: 'Entschieden',
  },
  'capture.dpOutcomeAria': {
    en: 'Decision outcome',
    da: 'Beslutningens udfald',
    sv: 'Beslutets utfall',
    de: 'Ergebnis der Entscheidung',
  },
  'capture.dpCancel': {
    en: 'Cancel',
    da: 'Annullér',
    sv: 'Avbryt',
    de: 'Abbrechen',
  },
  'settings.decisionPointTypes': {
    en: 'Decision points',
    da: 'Beslutningspunkter',
    sv: 'Beslutspunkter',
    de: 'Entscheidungspunkte',
  },
  'settings.decisionPointTypesDesc': {
    en: 'The end-to-end decisions a case moves towards. Each has its own outcome wording; end-to-end times are measured to each point.',
    da: 'De gennemgående beslutninger, en sag bevæger sig imod. Hver har sin egen formulering af udfaldet; end-to-end-tider måles til hvert punkt.',
    sv: 'De genomgående beslut ett ärende rör sig mot. Varje punkt har sin egen formulering av utfallet; end-to-end-tider mäts till varje punkt.',
    de: 'Die Entscheidungen, auf die ein Fall zuläuft. Jede hat ihre eigene Ergebnis-Formulierung; End-to-End-Zeiten werden je Punkt gemessen.',
  },
  'settings.dpPositiveLabel': {
    en: 'Positive outcome',
    da: 'Positivt udfald',
    sv: 'Positivt utfall',
    de: 'Positives Ergebnis',
  },
  'settings.dpNegativeLabel': {
    en: 'Negative outcome',
    da: 'Negativt udfald',
    sv: 'Negativt utfall',
    de: 'Negatives Ergebnis',
  },
  'settings.decisionOutcomes': {
    en: 'Outcomes',
    da: 'Udfald',
    sv: 'Utfall',
    de: 'Ergebnisse',
  },
  'settings.addOutcome': {
    en: 'Add outcome',
    da: 'Tilføj udfald',
    sv: 'Lägg till utfall',
    de: 'Ergebnis hinzufügen',
  },
  'settings.toneOnTarget': {
    en: 'On target',
    da: 'Som ønsket',
    sv: 'Som önskat',
    de: 'Wie gewünscht',
  },
  'settings.toneVariation': {
    en: 'Variation',
    da: 'Variation',
    sv: 'Variation',
    de: 'Variation',
  },
  'settings.toneNegative': {
    en: 'Negative',
    da: 'Negativt',
    sv: 'Negativt',
    de: 'Negativ',
  },
  'settings.milestones': {
    en: 'Milestones',
    da: 'Milepæle',
    sv: 'Milstolpar',
    de: 'Meilensteine',
  },
  'settings.milestonesDesc': {
    en: 'Ordered milestones a case moves through. Each groups its decision points and has its own achieved / not-achieved outcome. A not-achieved milestone halts the journey.',
    da: 'Rækkefølgen af milepæle, en sag bevæger sig igennem. Hver samler sine beslutningspunkter og har sit eget udfald: opnået / ikke opnået. En ikke-opnået milepæl standser forløbet.',
    sv: 'Ordnade milstolpar ett ärende rör sig genom. Varje samlar sina beslutspunkter och har sitt eget utfall: uppnådd / ej uppnådd. En ej uppnådd milstolpe stoppar förloppet.',
    de: 'Geordnete Meilensteine, die ein Fall durchläuft. Jeder bündelt seine Entscheidungspunkte und hat ein eigenes Ergebnis: erreicht / nicht erreicht. Ein nicht erreichter Meilenstein stoppt den Verlauf.',
  },
  'settings.addMilestone': {
    en: 'Add milestone',
    da: 'Tilføj milepæl',
    sv: 'Lägg till milstolpe',
    de: 'Meilenstein hinzufügen',
  },
  'settings.milestoneLabel': {
    en: 'Milestone name',
    da: 'Milepælens navn',
    sv: 'Milstolpens namn',
    de: 'Name des Meilensteins',
  },
  'settings.assignToMilestone': {
    en: 'Milestone',
    da: 'Milepæl',
    sv: 'Milstolpe',
    de: 'Meilenstein',
  },
  'settings.unassignedDecisions': {
    en: 'Unassigned decision points',
    da: 'Ikke-tildelte beslutningspunkter',
    sv: 'Otilldelade beslutspunkter',
    de: 'Nicht zugeordnete Entscheidungspunkte',
  },
  'settings.moveUp': {
    en: 'Move up',
    da: 'Flyt op',
    sv: 'Flytta upp',
    de: 'Nach oben',
  },
  'settings.moveDown': {
    en: 'Move down',
    da: 'Flyt ned',
    sv: 'Flytta ner',
    de: 'Nach unten',
  },
  'capture.milestoneAchieved': {
    en: 'Achieved',
    da: 'Opnået',
    sv: 'Uppnådd',
    de: 'Erreicht',
  },
  'capture.milestoneNotAchieved': {
    en: 'Not achieved',
    da: 'Ikke opnået',
    sv: 'Ej uppnådd',
    de: 'Nicht erreicht',
  },
  'capture.milestoneOutcomeAria': {
    en: 'Milestone outcome',
    da: 'Milepælens udfald',
    sv: 'Milstolpens utfall',
    de: 'Ergebnis des Meilensteins',
  },
  'capture.milestoneReachedAtLabel': {
    en: 'Reached',
    da: 'Nået',
    sv: 'Nådd',
    de: 'Erreicht am',
  },
  'capture.milestoneLocked': {
    en: 'Earlier milestone not yet achieved — tap to record anyway',
    da: 'Tidligere milepæl er ikke opnået endnu — tryk for at registrere alligevel',
    sv: 'Tidigare milstolpe är inte uppnådd ännu — tryck för att registrera ändå',
    de: 'Früherer Meilenstein noch nicht erreicht — tippen, um trotzdem zu erfassen',
  },
  'capture.milestoneExpand': {
    en: 'Expand milestone',
    da: 'Udvid milepæl',
    sv: 'Expandera milstolpe',
    de: 'Meilenstein ausklappen',
  },
  'capture.milestoneCollapse': {
    en: 'Collapse milestone',
    da: 'Fold milepæl sammen',
    sv: 'Fäll ihop milstolpe',
    de: 'Meilenstein einklappen',
  },
  'capture.flowEntryWork': {
    en: 'Work we did',
    da: 'Udført arbejde',
    sv: 'Utfört arbete',
    de: 'Geleistete Arbeit',
  },
  'capture.flowEntryDemand': {
    en: 'Demand came in',
    da: 'Efterspørgsel kom ind',
    sv: 'Efterfrågan kom in',
    de: 'Anliegen kam herein',
  },
  'capture.flowEntryKindAria': {
    en: 'Was this work we did, or demand that came in?',
    da: 'Var dette udført arbejde eller indkommen efterspørgsel?',
    sv: 'Var detta utfört arbete eller inkommen efterfrågan?',
    de: 'War dies geleistete Arbeit oder ein eingehendes Anliegen?',
  },
  'capture.flowScQuestion': {
    en: 'Which system condition is driving this?',
    da: 'Hvilket systemforhold driver dette?',
    sv: 'Vilket systemvillkor driver detta?',
    de: 'Welche Systembedingung treibt dies an?',
  },
  'capture.caseAttachLast': {
    en: 'Attach last entry to this case',
    da: 'Knyt seneste registrering til denne sag',
    sv: 'Koppla senaste registreringen till detta ärende',
    de: 'Letzten Eintrag diesem Fall zuordnen',
  },
  // Flow case zones (2026-06-14): label the history vs the "add" composer.
  'capture.casePreviousTouches': {
    en: 'Previous touches',
    da: 'Tidligere berøringer',
    sv: 'Tidigare kontakter',
    de: 'Frühere Kontakte',
  },
  'capture.caseComposerHeading': {
    en: "What's happening now?",
    da: 'Hvad sker der nu?',
    sv: 'Vad händer nu?',
    de: 'Was passiert jetzt?',
  },
  // C5 (2026-06-17): heading over the frozen decision-milestone pane.
  'capture.caseDecisionsHeading': {
    en: 'Decisions',
    da: 'Beslutninger',
    sv: 'Beslut',
    de: 'Entscheidungen',
  },
  'capture.caseShowEarlierTouches': {
    en: 'Show {count} earlier',
    da: 'Vis {count} tidligere',
    sv: 'Visa {count} tidigare',
    de: '{count} frühere anzeigen',
  },
  'capture.caseShowLess': {
    en: 'Show less',
    da: 'Vis mindre',
    sv: 'Visa mindre',
    de: 'Weniger anzeigen',
  },
  // Flow-mode customer entry (2026-06-14): one unified type-ahead reference
  // field. Type a reference — a match continues that customer, no match opens a
  // new one. User-facing copy says "customer" (the internal model stays "case").
  // Flow-only — the transactional case* strings above are unchanged.
  'capture.customerRefHeading': {
    en: 'Which customer is this?',
    da: 'Hvilken kunde er det?',
    sv: 'Vilken kund gäller det?',
    de: 'Um welchen Kunden geht es?',
  },
  // C5/R9 (2026-06-17): pill atop the freeze left pane to find/open another
  // customer (a new reference number) without leaving the capture page.
  'capture.openNewReference': {
    en: 'Open new account reference number',
    da: 'Åbn nyt kontoreferencenummer',
    sv: 'Öppna nytt kontoreferensnummer',
    de: 'Neue Kontoreferenznummer öffnen',
  },
  'capture.openExistingAccount': {
    en: 'Open existing account',
    da: 'Åbn eksisterende konto',
    sv: 'Öppna befintligt konto',
    de: 'Bestehendes Konto öffnen',
  },
  // C5 case-search table (2026-06-17): the "Which customer is this?" overview.
  'capture.caseTableAccount': {
    en: 'Account Number',
    da: 'Kontonummer',
    sv: 'Kontonummer',
    de: 'Kontonummer',
  },
  'capture.caseTableP2bs': {
    en: 'P2BS',
    da: 'P2BS',
    sv: 'P2BS',
    de: 'P2BS',
  },
  'capture.caseTableWhatMatters': {
    en: 'What Matters',
    da: 'Hvad betyder noget',
    sv: 'Vad är viktigt',
    de: 'Was wichtig ist',
  },
  'capture.caseTableEnter': {
    en: 'Enter Case',
    da: 'Åbn sag',
    sv: 'Öppna ärende',
    de: 'Fall öffnen',
  },
  'capture.caseSearchPlaceholder': {
    en: 'Search or type a new account reference number…',
    da: 'Søg eller indtast et nyt kontoreferencenummer…',
    sv: 'Sök eller ange ett nytt kontoreferensnummer…',
    de: 'Suchen oder neue Kontoreferenznummer eingeben…',
  },
  'capture.caseTableEmpty': {
    en: 'No customers yet — type a reference number above to start one.',
    da: 'Ingen kunder endnu — indtast et referencenummer ovenfor for at starte.',
    sv: 'Inga kunder ännu — ange ett referensnummer ovan för att börja.',
    de: 'Noch keine Kunden — geben Sie oben eine Referenznummer ein, um zu beginnen.',
  },
  'capture.customerRefPlaceholder': {
    en: 'Customer ref (number only)',
    da: 'Kundereference (kun nummer)',
    sv: 'Kundreferens (endast nummer)',
    de: 'Kundenreferenz (nur Nummer)',
  },
  'capture.customerRefHelp': {
    en: 'One account reference number = one customer = one value demand. Several collectors can add entries to the same customer over time — type the same number to pick up where it left off. Privacy: use the account reference number only, never a name.',
    da: 'Ét kontoreferencenummer = én kunde = én værdiskabende efterspørgsel. Flere indsamlere kan tilføje registreringer til samme kunde over tid — skriv det samme nummer for at fortsætte, hvor I slap. Privatliv: brug kun kontoreferencenummeret, aldrig et navn.',
    sv: 'Ett kontoreferensnummer = en kund = en värdeskapande efterfrågan. Flera insamlare kan lägga till registreringar för samma kund över tid — skriv samma nummer för att fortsätta där ni slutade. Integritet: använd endast kontoreferensnumret, aldrig ett namn.',
    de: 'Eine Kontoreferenznummer = ein Kunde = ein Anliegen. Mehrere Personen können demselben Kunden über die Zeit Einträge hinzufügen — dieselbe Nummer eingeben, um weiterzumachen. Datenschutz: nur die Kontoreferenznummer verwenden, niemals einen Namen.',
  },
  'capture.customerRecentOpen': {
    en: 'Recent customers',
    da: 'Seneste kunder',
    sv: 'Senaste kunder',
    de: 'Zuletzt geöffnete Kunden',
  },
  'capture.customerOpenAsNew': {
    en: 'Open #{ref} as a new customer',
    da: 'Åbn #{ref} som en ny kunde',
    sv: 'Öppna #{ref} som en ny kund',
    de: '#{ref} als neuen Kunden öffnen',
  },
  // Entry-screen cold start (2026-06-17): smart field + recent list. The live
  // feedback line below the field (Resume an existing customer / open a new one)
  // and the recent-customers rows. Flow + freeze only.
  'capture.customerResume': {
    en: 'Resume',
    da: 'Fortsæt',
    sv: 'Fortsätt',
    de: 'Fortsetzen',
  },
  'capture.customerNewHint': {
    en: 'New customer — starts a fresh case',
    da: 'Ny kunde — starter en ny sag',
    sv: 'Ny kund — startar ett nytt ärende',
    de: 'Neuer Kunde — beginnt einen neuen Fall',
  },
  'capture.customerFoundPrefix': {
    en: 'Found',
    da: 'Fundet',
    sv: 'Hittad',
    de: 'Gefunden',
  },
  'capture.customerOpenedOn': {
    en: 'opened {date}',
    da: 'åbnet {date}',
    sv: 'öppnad {date}',
    de: 'geöffnet {date}',
  },
  'capture.customerTouches': {
    en: '{n} touches',
    da: '{n} berøringer',
    sv: '{n} kontakter',
    de: '{n} Kontakte',
  },
  'capture.customerTouchOne': {
    en: '1 touch',
    da: '1 berøring',
    sv: '1 kontakt',
    de: '1 Kontakt',
  },
  'capture.customerNoMatch': {
    en: 'No existing match.',
    da: 'Ingen eksisterende match.',
    sv: 'Ingen befintlig träff.',
    de: 'Keine vorhandene Übereinstimmung.',
  },
  // Flow open-state: customer-worded variants of the shared case footer/chip
  // strings (the transactional case* versions stay as-is).
  'capture.customerAttachNote': {
    en: 'New entries attach to this customer.',
    da: 'Nye registreringer knyttes til denne kunde.',
    sv: 'Nya registreringar kopplas till denna kund.',
    de: 'Neue Einträge werden diesem Kunden zugeordnet.',
  },
  'capture.customerCloseBtn': {
    en: 'Close customer',
    da: 'Luk kunde',
    sv: 'Avsluta kund',
    de: 'Kunde schließen',
  },
  'capture.customerAttachLast': {
    en: 'Attach last entry to this customer',
    da: 'Knyt seneste registrering til denne kunde',
    sv: 'Koppla senaste registreringen till denna kund',
    de: 'Letzten Eintrag diesem Kunden zuordnen',
  },
  // Flow CaseContextSection: the value-demand picker, worded for "customer"
  // (the transactional header keeps capture.caseDemandTypePlaceholder).
  'capture.customerDemandTypePlaceholder': {
    en: 'Which value demand is this?',
    da: 'Hvilken værdiskabende efterspørgsel er dette?',
    sv: 'Vilken värdeskapande efterfrågan är detta?',
    de: 'Welches Anliegen ist das?',
  },
  'capture.toggles.sequenceWork': {
    en: 'Capture sequence work',
    da: 'Registrer sekvensarbejde',
    sv: 'Registrera sekvensarbete',
    de: 'Sequenzarbeit erfassen',
  },
  'capture.toggles.workClassification': {
    en: 'Classify work (value / failure / ?)',
    da: 'Klassificer arbejde (værdi / ikke-værdi / ?)',
    sv: 'Klassificera arbete (värde / icke-värde / ?)',
    de: 'Arbeit klassifizieren (Wert / Fehler / ?)',
  },
  'capture.toggles.whatMatters': {
    en: 'Capture what matters',
    da: 'Registrer hvad der betyder noget',
    sv: 'Registrera vad som är viktigt',
    de: 'Was wichtig ist erfassen',
  },
  'capture.toggles.thinkings': {
    en: 'Capture thinking',
    da: 'Registrer tænkning',
    sv: 'Registrera tänkande',
    de: 'Denken erfassen',
  },
  'capture.toggles.synthesis': {
    en: 'Synthesise system conditions',
    da: 'Syntetisér systemforhold',
    sv: 'Syntetisera systemvillkor',
    de: 'Systembedingungen zusammenführen',
  },
  'capture.toggles.flowAnalytics': {
    en: 'Flow analytics dashboard',
    da: 'Flow-analyseoverblik',
    sv: 'Flödesanalysöversikt',
    de: 'Flow-Analyse-Dashboard',
  },
  'capture.toggles.flowFailureDemandTypes': {
    en: 'Failure-demand type per flow step',
    da: 'Type af ikke-værdiskabende efterspørgsel pr. flow-trin',
    sv: 'Typ av icke-värdeskapande efterfrågan per flödessteg',
    de: 'Fehler-Nachfrage-Typ je Flow-Schritt',
  },
  'capture.toggles.lifeProblems': {
    en: 'Capture life problems',
    da: 'Registrer livsproblemer',
    sv: 'Registrera livsproblem',
    de: 'Lebensprobleme erfassen',
  },
  'capture.newTypePlaceholder': {
    en: 'New type name...',
    da: 'Nyt typenavn...',
    sv: 'Nytt typnamn...',
    de: 'Neuer Typname...',
  },
  'capture.searchEntries': {
    en: 'Search previous entries',
    da: 'Søg i tidligere registreringer',
    sv: 'Sök i tidigare poster',
    de: 'Frühere Einträge durchsuchen',
  },
  'capture.searchPlaceholder': {
    en: 'Search verbatims...',
    da: 'Søg i fritekst...',
    sv: 'Sök i fritext...',
    de: 'Freitext durchsuchen...',
  },
  'capture.searchNoResults': {
    en: 'No matching entries',
    da: 'Ingen matchende registreringer',
    sv: 'Inga matchande poster',
    de: 'Keine passenden Einträge',
  },
  'capture.showExamples': {
    en: 'Show examples',
    da: 'Vis eksempler',
    sv: 'Visa exempel',
    de: 'Beispiele anzeigen',
  },
  'capture.hideExamples': {
    en: 'Hide',
    da: 'Skjul',
    sv: 'Dölj',
    de: 'Ausblenden',
  },
  'capture.noExamples': {
    en: 'No entries for this type yet',
    da: 'Ingen registreringer for denne type endnu',
    sv: 'Inga poster för denna typ ännu',
    de: 'Noch keine Einträge für diesen Typ',
  },

  // Reclassification warning
  'layers.reclassifyWarning': {
    en: '{count} entries still need reclassification for the current layer. Activate anyway?',
    da: '{count} registreringer mangler stadig omklassificering for det nuv\u00e6rende lag. Aktiver alligevel?',
    sv: '{count} poster beh\u00f6ver fortfarande omklassificering f\u00f6r nuvarande lager. Aktivera \u00e4nd\u00e5?',
    de: '{count} Eintr\u00e4ge m\u00fcssen noch f\u00fcr die aktuelle Ebene neu klassifiziert werden. Trotzdem aktivieren?',
  },
  'layers.noReclassifyNeeded': {
    en: 'All entries are up to date. Activate Layer {layer}?',
    da: 'Alle registreringer er opdaterede. Aktiver lag {layer}?',
    sv: 'Alla poster \u00e4r uppdaterade. Aktivera lager {layer}?',
    de: 'Alle Eintr\u00e4ge sind aktuell. Ebene {layer} aktivieren?',
  },

  // Operational definitions
  'settings.operationalDefinition': {
    en: 'Operational definition',
    da: 'Operationel definition',
    sv: 'Operationell definition',
    de: 'Operationale Definition',
  },
  'settings.operationalDefinitionPlaceholder': {
    en: 'Define what this means in practice...',
    da: 'Definér hvad dette betyder i praksis...',
    sv: 'Definiera vad detta innebär i praktiken...',
    de: 'Definieren Sie, was das in der Praxis bedeutet...',
  },
  // --- Lifecycle (Customer Lifecycle / tVM) ---
  'settings.lifecycle': {
    en: 'Customer Lifecycle (optional)',
    da: 'Kundens livscyklus (valgfrit)',
    sv: 'Kundens livscykel (valfritt)',
    de: 'Kundenlebenszyklus (optional)',
  },
  'settings.lifecycleDesc': {
    en: 'Optional Vanguard Method lens. AI auto-tags each demand/work type with a lifecycle stage. Only type labels are sent to the AI — never customer verbatims.',
    da: 'Valgfri linse fra Vanguard Metoden. AI mærker automatisk hver efterspørgselstype og arbejdstype med en livscyklusfase. Kun typebetegnelser sendes til AI — aldrig kundernes egne ord.',
    sv: 'Valfri lins från Vanguard-metoden. AI taggar automatiskt varje efterfråge- och arbetstyp med en livscykelfas. Endast typetiketter skickas till AI — aldrig kundernas egna ord.',
    de: 'Optionales Linsen-Werkzeug der Vanguard-Methode. KI markiert automatisch jeden Nachfrage-/Arbeitstyp mit einer Lebenszyklusphase. Es werden nur Typbezeichnungen an die KI gesendet — niemals Kundenaussagen.',
  },
  'settings.enableLifecycle': {
    en: 'Enable customer lifecycle',
    da: 'Aktiver kundens livscyklus',
    sv: 'Aktivera kundens livscykel',
    de: 'Kundenlebenszyklus aktivieren',
  },
  'settings.lifecycleStages': {
    en: 'Lifecycle stages',
    da: 'Livscyklusfaser',
    sv: 'Livscykelfaser',
    de: 'Lebenszyklusphasen',
  },
  'settings.addLifecycleStage': {
    en: 'Add stage...',
    da: 'Tilføj fase...',
    sv: 'Lägg till fas...',
    de: 'Phase hinzufügen...',
  },
  'settings.classifyAllTypes': {
    en: 'Re-classify all types with AI',
    da: 'Klassificér alle typer på ny med AI',
    sv: 'Klassificera om alla typer med AI',
    de: 'Alle Typen mit KI neu klassifizieren',
  },
  'settings.classifying': {
    en: 'Classifying...',
    da: 'Klassificerer...',
    sv: 'Klassificerar...',
    de: 'Klassifiziere...',
  },
  'settings.lifecycleNoStage': {
    en: 'No stage',
    da: 'Ingen fase',
    sv: 'Ingen fas',
    de: 'Keine Phase',
  },
  'dashboard.lifecycleSankey': {
    en: 'Lifecycle stage → classification',
    da: 'Livscyklusfase → klassificering',
    sv: 'Livscykelfas → klassificering',
    de: 'Lebenszyklusphase → Klassifizierung',
  },
  'dashboard.lifecycleByStage': {
    en: 'Failure demand by lifecycle stage',
    da: 'Ikke-værdiskabende efterspørgsel efter livscyklusfase',
    sv: 'Icke-värdeskapande efterfrågan efter livscykelfas',
    de: 'Fehlnachfrage nach Lebenszyklusphase',
  },
  'dashboard.lifecycleFilter': {
    en: 'Lifecycle',
    da: 'Livscyklus',
    sv: 'Livscykel',
    de: 'Lebenszyklus',
  },
  'dashboard.lifecycleFilterAll': {
    en: 'All stages',
    da: 'Alle faser',
    sv: 'Alla faser',
    de: 'Alle Phasen',
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
  // Capability of response (formerly "Handling Types")
  ['One Stop', 'One Stop', 'One Stop', 'One Stop'],
  ['Pass-on', 'Sendt videre', 'Skickat vidare', 'Weitergeleitet'],
  ['Pass-back', 'Sendt tilbage', 'Skickat tillbaka', 'Zurückgeleitet'],
  // Legacy capability-of-response options (from older studies)
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
  // Work types
  ['Information request (internal)', 'Informationsforespørgsel (intern)', 'Informationsförfrågan (intern)', 'Informationsanfrage (intern)'],
  ['Management reporting', 'Ledelsesrapportering', 'Ledningsrapportering', 'Management-Berichterstattung'],
  ['Internal process query', 'Intern procesforespørgsel', 'Intern processförfrågan', 'Interne Prozessanfrage'],
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
