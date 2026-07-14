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
  // Value creation capability (migration 0059, 2026-07-09). EN is Jonas's exact
  // wording; da/sv/de drafted natively — pending Jonas's approval before prod.
  'capture.valueCreationCapabilityLabel': {
    en: 'When applicable, what do we think our value creation capability was?',
    da: 'Når det er relevant, hvad tror vi vores evne til værdiskabelse var?',
    sv: 'När det är relevant, vad tror vi att vår värdeskapandekapabilitet var?',
    de: 'Wenn zutreffend, wie schätzen wir unsere Wertschöpfungsfähigkeit ein?',
  },
  'capture.valueCreationCapabilityPlaceholder': {
    en: 'Select value creation capability…',
    da: 'Vælg evne til værdiskabelse…',
    sv: 'Välj värdeskapandekapabilitet…',
    de: 'Wertschöpfungsfähigkeit wählen…',
  },
  'capture.valueCreationCapability.created': {
    en: 'Value Created',
    da: 'Værdi skabt',
    sv: 'Värde skapat',
    de: 'Wert geschaffen',
  },
  'capture.valueCreationCapability.createdDef': {
    en: 'The system and I went over and above my expectations, really blew the customer away.',
    da: 'Systemet og jeg overgik kundens forventninger og imponerede kunden stort.',
    sv: 'Systemet och jag överträffade kundens förväntningar och imponerade stort på kunden.',
    de: 'Das System und ich haben die Erwartungen des Kunden übertroffen und ihn wirklich begeistert.',
  },
  'capture.valueCreationCapability.maintained': {
    en: 'Value Maintained',
    da: 'Værdi fastholdt',
    sv: 'Värde bibehållet',
    de: 'Wert erhalten',
  },
  'capture.valueCreationCapability.maintainedDef': {
    en: 'The system and I did what the customer needed or expected.',
    da: 'Systemet og jeg gjorde det, kunden havde brug for eller forventede.',
    sv: 'Systemet och jag gjorde det som kunden behövde eller förväntade sig.',
    de: 'Das System und ich haben getan, was der Kunde brauchte oder erwartete.',
  },
  'capture.valueCreationCapability.missed': {
    en: 'Missed Opportunity',
    da: 'Forpasset mulighed',
    sv: 'Missad möjlighet',
    de: 'Verpasste Gelegenheit',
  },
  'capture.valueCreationCapability.missedDef': {
    en: 'The system and I should have been able to do more to help ensure the customer was set up for success to allow value to flow perfectly.',
    da: 'Systemet og jeg burde have kunnet gøre mere for at sikre, at kunden var sat op til succes, så værdien kunne flyde perfekt.',
    sv: 'Systemet och jag borde ha kunnat göra mer för att säkerställa att kunden var rustad för framgång så att värdet kunde flöda perfekt.',
    de: 'Das System und ich hätten mehr tun können, damit der Kunde auf Erfolg ausgerichtet ist und der Wert perfekt fließen kann.',
  },
  // Broker/Direct channel (migration 0061, 2026-07-10). Domain terms (not Vanguard);
  // da/sv/de drafted — pending Jonas's approval before prod.
  'capture.channelLabel': {
    en: 'Channel',
    da: 'Kanal',
    sv: 'Kanal',
    de: 'Kanal',
  },
  'capture.channelBroker': {
    en: 'Broker',
    da: 'Mægler',
    sv: 'Mäklare',
    de: 'Makler',
  },
  'capture.channelDirect': {
    en: 'Direct',
    da: 'Direkte',
    sv: 'Direkt',
    de: 'Direkt',
  },
  'capture.brokerDetails': {
    en: 'Broker details',
    da: 'Mæglerdetaljer',
    sv: 'Mäklaruppgifter',
    de: 'Maklerdetails',
  },
  'capture.brokerFirm': {
    en: 'Firm',
    da: 'Firma',
    sv: 'Firma',
    de: 'Firma',
  },
  'capture.brokerName': {
    en: 'Broker',
    da: 'Mægler',
    sv: 'Mäklare',
    de: 'Makler',
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
  // Reset description = abandon the entry being typed (kept distinct from
  // Undo's "Fortryd"/"Ångra" since both can be visible at once).
  'capture.regret': {
    en: 'Reset description',
    da: 'Ryd beskrivelsen',
    sv: 'Rensa beskrivningen',
    de: 'Beschreibung zurücksetzen',
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
  // Study templates (0052): save this study's settings as a named template.
  'settings.saveAsTemplate': {
    en: 'Save as template',
    da: 'Gem som skabelon',
    sv: 'Spara som mall',
    de: 'Als Vorlage speichern',
  },
  'settings.templateNamePlaceholder': {
    en: 'e.g. EG mortgages',
    da: 'f.eks. EG mortgages',
    sv: 't.ex. EG mortgages',
    de: 'z. B. EG mortgages',
  },
  'settings.saveTemplate': {
    en: 'Save',
    da: 'Gem',
    sv: 'Spara',
    de: 'Speichern',
  },
  'settings.templateSaved': {
    en: 'Saved ✓',
    da: 'Gemt ✓',
    sv: 'Sparad ✓',
    de: 'Gespeichert ✓',
  },
  'settings.templateSaveFailed': {
    en: 'Could not save the template',
    da: 'Skabelonen kunne ikke gemmes',
    sv: 'Mallen kunde inte sparas',
    de: 'Die Vorlage konnte nicht gespeichert werden',
  },
  'settings.templateReplaceConfirm': {
    en: 'A template with this name exists — replace it?',
    da: 'Der findes allerede en skabelon med dette navn — vil du erstatte den?',
    sv: 'Det finns redan en mall med det här namnet — vill du ersätta den?',
    de: 'Es gibt bereits eine Vorlage mit diesem Namen — ersetzen?',
  },
  'settings.templateReplace': {
    en: 'Replace',
    da: 'Erstat',
    sv: 'Ersätt',
    de: 'Ersetzen',
  },
  'create.chooseTemplate': {
    en: 'Choose a template',
    da: 'Vælg en skabelon',
    sv: 'Välj en mall',
    de: 'Vorlage wählen',
  },
  'create.templateHint': {
    en: 'Settings only — captured data is never copied',
    da: 'Kun indstillinger — indsamlede data kopieres aldrig',
    sv: 'Endast inställningar — insamlade data kopieras aldrig',
    de: 'Nur Einstellungen — erfasste Daten werden nie kopiert',
  },
  'create.templateDeleteConfirm': {
    en: 'Delete this template?',
    da: 'Slet denne skabelon?',
    sv: 'Ta bort den här mallen?',
    de: 'Diese Vorlage löschen?',
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
  // Short acronym form for the compact green-box section header (kept identical
  // across languages, like the VS/IVS abbreviations).
  'capture.lp2bs': {
    en: 'LP2BS',
    da: 'LP2BS',
    sv: 'LP2BS',
    de: 'LP2BS',
  },
  'capture.remove': {
    en: 'Remove',
    da: 'Fjern',
    sv: 'Ta bort',
    de: 'Entfernen',
  },
  // Structured what-matters asks + decision capture fields (2026-07-02).
  'settings.wmShowAtCapture': {
    en: 'Show at capture',
    da: 'Vis ved registrering',
    sv: 'Visa vid registrering',
    de: 'Bei Erfassung zeigen',
  },
  'settings.wmValueKind': {
    en: 'Ask for',
    da: 'Spørg om',
    sv: 'Fråga efter',
    de: 'Erfassen als',
  },
  'settings.wmValueKindNone': {
    en: '—',
    da: '—',
    sv: '—',
    de: '—',
  },
  'settings.wmValueKindAmount': {
    en: 'Amount',
    da: 'Beløb',
    sv: 'Belopp',
    de: 'Betrag',
  },
  'settings.wmValueKindDateOrDuration': {
    en: 'Date or duration',
    da: 'Dato eller varighed',
    sv: 'Datum eller varaktighet',
    de: 'Datum oder Dauer',
  },
  // "Evaluate against" on the What Matters row (2026-07-02, slice 5): pick the
  // decision that delivers on the ask; the delivered-value box follows.
  'settings.wmEvaluateAgainst': {
    en: 'Evaluate against',
    da: 'Evalueres mod',
    sv: 'Utvärderas mot',
    de: 'Bewertet gegen',
  },
  'settings.wmCapturedAs': {
    en: 'captured as',
    da: 'registreres som',
    sv: 'registreras som',
    de: 'erfasst als',
  },
  'capture.wmAmountSpecific': {
    en: 'Specific',
    da: 'Præcist',
    sv: 'Exakt',
    de: 'Genau',
  },
  'capture.wmAmountRange': {
    en: 'Range',
    da: 'Interval',
    sv: 'Intervall',
    de: 'Spanne',
  },
  'capture.wmAmountPlaceholder': {
    en: 'Amount',
    da: 'Beløb',
    sv: 'Belopp',
    de: 'Betrag',
  },
  'capture.wmAmountMinPlaceholder': {
    en: 'Lower',
    da: 'Nedre',
    sv: 'Nedre',
    de: 'Untere',
  },
  'capture.wmAmountMaxPlaceholder': {
    en: 'Upper',
    da: 'Øvre',
    sv: 'Övre',
    de: 'Obere',
  },
  'capture.wmModeDate': {
    en: 'Date',
    da: 'Dato',
    sv: 'Datum',
    de: 'Datum',
  },
  'capture.wmModeDuration': {
    en: 'Years + months',
    da: 'År + måneder',
    sv: 'År + månader',
    de: 'Jahre + Monate',
  },
  'capture.wmYearsPlaceholder': {
    en: 'Years',
    da: 'År',
    sv: 'År',
    de: 'Jahre',
  },
  'capture.wmMonthsPlaceholder': {
    en: 'Months',
    da: 'Måneder',
    sv: 'Månader',
    de: 'Monate',
  },
  'settings.decisionCaptureFields': {
    en: 'Capture at this decision',
    da: 'Registrér ved denne beslutning',
    sv: 'Registrera vid detta beslut',
    de: 'Bei dieser Entscheidung erfassen',
  },
  'settings.addCaptureField': {
    en: 'Add field',
    da: 'Tilføj felt',
    sv: 'Lägg till fält',
    de: 'Feld hinzufügen',
  },
  'settings.captureFieldKindAmount': {
    en: 'Amount',
    da: 'Beløb',
    sv: 'Belopp',
    de: 'Betrag',
  },
  'settings.captureFieldKindDate': {
    en: 'Date',
    da: 'Dato',
    sv: 'Datum',
    de: 'Datum',
  },
  'settings.captureFieldKindDuration': {
    en: 'Duration',
    da: 'Varighed',
    sv: 'Varaktighet',
    de: 'Dauer',
  },
  'settings.captureFieldKindChoice': {
    en: 'Choice',
    da: 'Valg',
    sv: 'Val',
    de: 'Auswahl',
  },
  'settings.captureFieldChoiceOptions': {
    en: 'Options, comma-separated',
    da: 'Valgmuligheder, adskilt med komma',
    sv: 'Alternativ, kommaseparerade',
    de: 'Optionen, durch Komma getrennt',
  },
  'settings.captureFieldLink': {
    en: 'Links to what matters',
    da: 'Kobles til hvad betyder noget',
    sv: 'Kopplas till vad är viktigt',
    de: 'Verknüpft mit was wichtig ist',
  },
  'capture.dpFieldsAria': {
    en: 'Decision capture fields',
    da: 'Registreringsfelter for beslutningen',
    sv: 'Registreringsfält för beslutet',
    de: 'Erfassungsfelder der Entscheidung',
  },
  // Ask evaluation on linked capture fields (2026-07-02, slice 3).
  'capture.wmAskLabel': {
    en: 'Asked',
    da: 'Ønsket',
    sv: 'Önskat',
    de: 'Gewünscht',
  },
  'capture.evalMet': {
    en: 'Met',
    da: 'Opfyldt',
    sv: 'Uppfyllt',
    de: 'Erfüllt',
  },
  'capture.evalNotMet': {
    en: 'Not met',
    da: 'Ikke opfyldt',
    sv: 'Ej uppfyllt',
    de: 'Nicht erfüllt',
  },
  'capture.evalDaysEarly': {
    en: 'days early',
    da: 'dage før tid',
    sv: 'dagar tidigt',
    de: 'Tage früher',
  },
  'capture.evalDaysLate': {
    en: 'days late',
    da: 'dage for sent',
    sv: 'dagar sent',
    de: 'Tage später',
  },
  'capture.evalUnderBudget': {
    en: 'under budget',
    da: 'under budget',
    sv: 'under budget',
    de: 'unter Budget',
  },
  'capture.evalOverBudget': {
    en: 'over budget',
    da: 'over budget',
    sv: 'över budget',
    de: 'über Budget',
  },
  'capture.unitYearsShort': {
    en: 'yr',
    da: 'år',
    sv: 'år',
    de: 'J.',
  },
  'capture.unitMonthsShort': {
    en: 'mo',
    da: 'mdr.',
    sv: 'mån',
    de: 'Mon.',
  },
  // Ask-delivery dashboard card (2026-07-02, slice 4). "What matters" wording
  // follows the canonical term.
  'dashboard.askDeliveryTitle': {
    en: 'Delivery on what matters',
    da: 'Levering på hvad betyder noget',
    sv: 'Leverans på vad är viktigt',
    de: 'Lieferung auf das, was wichtig ist',
  },
  'dashboard.askDeliveryHint': {
    en: 'How well we delivered on each thing the customer said mattered.',
    da: 'Hvor godt vi leverede på hver ting, kunden sagde betød noget.',
    sv: 'Hur väl vi levererade på varje sak kunden sa var viktig.',
    de: 'Wie gut wir jede Sache erfüllt haben, die dem Kunden wichtig war.',
  },
  // Sub-labels distinguishing the two lenses inside the one "Delivery on what
  // matters" card (only shown when both are present).
  'dashboard.wmByCompletion': {
    en: 'By when the case completed',
    da: 'Efter hvornår sagen blev afsluttet',
    sv: 'Efter när ärendet slutfördes',
    de: 'Nach dem Abschlusszeitpunkt des Falls',
  },
  'dashboard.wmByCapturedValue': {
    en: 'By the captured decision value',
    da: 'Efter den registrerede beslutningsværdi',
    sv: 'Efter det registrerade beslutsvärdet',
    de: 'Nach dem erfassten Entscheidungswert',
  },
  'dashboard.askAvgDeviation': {
    en: 'Avg deviation',
    da: 'Gns. afvigelse',
    sv: 'Snitt avvikelse',
    de: 'Ø Abweichung',
  },
  'dashboard.askAvgOverBudget': {
    en: 'Avg over budget',
    da: 'Gns. over budget',
    sv: 'Snitt över budget',
    de: 'Ø über Budget',
  },
  // Ask + recorded decision but no delivered value — a capture miss, surfaced
  // rather than silently excluded (2026-07-02).
  'dashboard.askNotCaptured': {
    en: 'Not captured',
    da: 'Ikke registreret',
    sv: 'Ej registrerat',
    de: 'Nicht erfasst',
  },
  // Budget capability card (2026-07-05). 'Capability' follows the canonical
  // Kapabilitet (DA/SV); DE composes with the file's existing Kapabilität.
  // Budget language is not Vanguard canon — plain words.
  'dashboard.budgetCapabilityTitle': {
    en: 'Budget capability',
    da: 'Budgetkapabilitet',
    sv: 'Budgetkapabilitet',
    de: 'Budget-Kapabilität',
  },
  'dashboard.budgetCapabilityHint': {
    en: 'Each point is one customer: how far the solution landed under or over what they could afford. The zero line is their budget.',
    da: 'Hvert punkt er én kunde: hvor langt løsningen landede under eller over, hvad de havde råd til. Nullinjen er deres budget.',
    sv: 'Varje punkt är en kund: hur långt lösningen hamnade under eller över vad de hade råd med. Nollinjen är deras budget.',
    de: 'Jeder Punkt ist ein Kunde: wie weit die Lösung unter oder über dem lag, was er sich leisten konnte. Die Nulllinie ist sein Budget.',
  },
  'dashboard.budgetWithinHeadline': {
    en: '{x} of {y} within budget',
    da: '{x} af {y} inden for budget',
    sv: '{x} av {y} inom budget',
    de: '{x} von {y} im Budget',
  },
  'dashboard.budgetUnitPct': {
    en: '% of budget',
    da: '% af budget',
    sv: '% av budget',
    de: '% des Budgets',
  },
  'dashboard.budgetUnitAmount': {
    en: 'Amount',
    da: 'Beløb',
    sv: 'Belopp',
    de: 'Betrag',
  },
  'dashboard.budgetZeroLine': {
    en: 'Budget',
    da: 'Budget',
    sv: 'Budget',
    de: 'Budget',
  },
  'dashboard.askAvgUnderBudget': {
    en: 'Avg under budget',
    da: 'Gns. under budget',
    sv: 'Snitt under budget',
    de: 'Ø unter Budget',
  },
  'dashboard.budgetPctExcluded': {
    en: 'excluded — budget can’t be shown as %',
    da: 'udeladt — budget kan ikke vises som %',
    sv: 'utelämnade — budget kan inte visas som %',
    de: 'ausgeschlossen — Budget kann nicht als % angezeigt werden',
  },
  'capture.askValueMissing': {
    en: 'value not captured',
    da: 'værdi ikke registreret',
    sv: 'värde ej registrerat',
    de: 'Wert nicht erfasst',
  },
  // Small category dividers in the green customer-context box (flow capture).
  // Canonical Vanguard terms sourced from the glossary / existing keys.
  'capture.valueDemandHeader': {
    en: 'Value demand',
    da: 'V\u00e6rdiskabende eftersp\u00f8rgsel',
    sv: 'V\u00e4rdeskapande efterfr\u00e5gan',
    de: 'Wert-Nachfrage',
  },
  // Native hover tooltip on the Value demand header in the customer context box
  // (2026-07-10). EN is Jonas's own wording; da/sv/de derived from the canonical
  // capture.demandClassificationHelp value-demand clause. Drafts pending approval.
  'capture.valueDemandDef': {
    en: 'Demand we want that relates to our reason for being.',
    da: 'Eftersp\u00f8rgsel vi \u00f8nsker, som knytter sig til vores eksistensberettigelse.',
    sv: 'Efterfr\u00e5gan vi vill ha, som h\u00f6r samman med v\u00e5rt existensber\u00e4ttigande.',
    de: 'Nachfrage, die wir wollen und die mit unserem Daseinszweck zusammenh\u00e4ngt.',
  },
  'capture.whatMattersHeader': {
    en: 'What matters',
    da: 'Hvad betyder noget',
    sv: 'Vad \u00e4r viktigt',
    de: 'Was wichtig ist',
  },
  'capture.contextHeader': {
    en: 'Context & situation',
    da: 'Kontekst & situation',
    sv: 'Kontext & situation',
    de: 'Kontext & Situation',
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
    en: '+ Add a block of work',
    da: '+ Tilf\u00f8j en arbejdsblok',
    sv: '+ L\u00e4gg till ett arbetsblock',
    de: '+ Arbeitsblock hinzuf\u00fcgen',
  },
  'capture.insertWorkBlock': {
    en: 'Insert block here',
    da: 'Inds\u00e6t blok her',
    sv: 'Infoga block h\u00e4r',
    de: 'Block hier einf\u00fcgen',
  },
  // Value steps (migration 0047).
  'capture.valueStepQuestion': {
    en: 'Related to what value step?',
    da: 'Relateret til hvilket v\u00e6rditrin?',
    sv: 'Relaterat till vilket v\u00e4rdesteg?',
    de: 'Auf welchen Wertschritt bezogen?',
  },
  'capture.selectValueStep': {
    en: 'Value step',
    da: 'V\u00e6rditrin',
    sv: 'V\u00e4rdesteg',
    de: 'Wertschritt',
  },
  'capture.workBlockDate': {
    en: 'Block date',
    da: 'Blokdato',
    sv: 'Blockdatum',
    de: 'Blockdatum',
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
  // Native hover tooltips on the four work-block tag pills (2026-07-10). EN wording
  // is Jonas's own; da/sv/de reuse the clauses of the already vault-sourced
  // capture.workClassificationHelp / capture.demandClassificationHelp below, so no
  // new Vanguard copy is invented. Never use fejlarbejde/felarbete/fejlefterspørgsel.
  'capture.workBlockTagValueDef': {
    en: 'Work that directly delivers purpose against what matters.',
    da: 'Arbejde der direkte leverer formålet i forhold til det, der betyder noget.',
    sv: 'Arbete som direkt levererar syftet mot det som betyder något.',
    de: 'Arbeit, die den Zweck unmittelbar im Hinblick auf das, was zählt, liefert.',
  },
  'capture.workBlockTagSequenceDef': {
    en: 'Good things to do, done at the wrong time or in the wrong way.',
    da: 'Gode ting at gøre, gjort på det forkerte tidspunkt eller på den forkerte måde.',
    sv: 'Bra saker att göra, gjorda vid fel tidpunkt eller på fel sätt.',
    de: 'Gute Dinge, die zur falschen Zeit oder auf die falsche Weise ausgeführt werden.',
  },
  'capture.workBlockTagFailureDef': {
    en: 'Every work other than value work or sequence work.',
    da: 'Alt arbejde ud over værdiskabende arbejde og sekvensarbejde.',
    sv: 'Allt arbete utöver värdeskapande arbete och sekvensarbete.',
    de: 'Jede Arbeit außer Wertarbeit und Sequenzarbeit.',
  },
  'capture.workBlockTagFailureDemandDef': {
    en: 'Demand caused by a failure to do something or do something right for the customer.',
    da: 'Efterspørgsel forårsaget af, at noget ikke er gjort, eller ikke er gjort rigtigt for kunden.',
    sv: 'Efterfrågan orsakad av att något inte har gjorts, eller inte har gjorts rätt för kunden.',
    de: 'Nachfrage, verursacht durch das Versäumnis, etwas oder etwas richtig für den Kunden zu tun.',
  },
  'capture.workBlockPlaceholder': {
    en: 'Describe this block of work...',
    da: 'Beskriv denne arbejdsblok...',
    sv: 'Beskriv detta arbetsblock...',
    de: 'Beschreibe diesen Arbeitsblock...',
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
    en: 'Select a work block…',
    da: 'Vælg en arbejdsblok…',
    sv: 'Välj ett arbetsblock…',
    de: 'Arbeitsblock auswählen…',
  },
  'capture.workStepPickerFreeText': {
    en: '— Free-text block',
    da: '— Fritekst-blok',
    sv: '— Fritext-block',
    de: '— Freitext-Block',
  },
  'capture.workStepClearAria': {
    en: 'Clear block',
    da: 'Ryd blok',
    sv: 'Rensa block',
    de: 'Block löschen',
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
  // Consolidated flow export dropdown + the boxed control-group labels (2026-07-05).
  'dashboard.exportMenu': {
    en: 'Export',
    da: 'Eksporter',
    sv: 'Exportera',
    de: 'Exportieren',
  },
  'dashboard.viewLabel': {
    en: 'View',
    da: 'Visning',
    sv: 'Vy',
    de: 'Ansicht',
  },
  'dashboard.periodLabel': {
    en: 'Period',
    da: 'Periode',
    sv: 'Period',
    de: 'Zeitraum',
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
  // Value steps (migration 0047).
  'dashboard.workByValueStepTitle': {
    en: 'Work by value step',
    da: 'Arbejde pr. værditrin',
    sv: 'Arbete per värdesteg',
    de: 'Arbeit nach Wertschritt',
  },
  'dashboard.workByValueStepHint': {
    en: 'Where value, sequence and failure work land across the value journey.',
    da: 'Hvor værdiskabende, sekvens- og ikke-værdiskabende arbejde falder i værdirejsen.',
    sv: 'Var värdeskapande, sekvens- och icke-värdeskapande arbete hamnar i värderesan.',
    de: 'Wo Wert-, Sequenz- und Fehlerarbeit auf der Wertreise anfallen.',
  },
  'dashboard.vsSortBy': {
    en: 'Sort by',
    da: 'Sortér efter',
    sv: 'Sortera efter',
    de: 'Sortieren nach',
  },
  'dashboard.vsSortJourney': {
    en: 'Journey order',
    da: 'Rejsens rækkefølge',
    sv: 'Resans ordning',
    de: 'Reihenfolge der Reise',
  },
  'dashboard.vsSortWaste': {
    en: 'Total waste',
    da: 'Spild i alt',
    sv: 'Totalt slöseri',
    de: 'Verschwendung gesamt',
  },
  // Per-value-step overview (2026-07-04): causes (system conditions) vs
  // consequences (non-value work + failure demand) for each value step.
  'dashboard.valueStepOverviewTitle': {
    en: 'Value step overview',
    da: 'Overblik pr. værditrin',
    sv: 'Översikt per värdesteg',
    de: 'Überblick je Wertschritt',
  },
  'dashboard.valueStepOverviewHint': {
    en: 'For each value step: the mix of work related to it, and the biggest system conditions driving it. System conditions are the causes — failure work and failure demand are the consequences.',
    da: 'For hvert værditrin: sammensætningen af arbejdet knyttet til det, og de største systemforhold der driver det. Systemforhold er årsagerne — ikke-værdiskabende arbejde og ikke-værdiskabende efterspørgsel er konsekvenserne.',
    sv: 'För varje värdesteg: sammansättningen av arbetet som hör till det, och de största systemvillkor som driver det. Systemvillkor är orsakerna — icke-värdeskapande arbete och icke-värdeskapande efterfrågan är konsekvenserna.',
    de: 'Für jeden Wertschritt: die Zusammensetzung der zugehörigen Arbeit und die größten Systembedingungen dahinter. Systembedingungen sind die Ursachen — Fehlerarbeit und Fehlernachfrage sind die Folgen.',
  },
  'dashboard.vsWorkSteps': {
    en: 'work blocks',
    da: 'arbejdsblokke',
    sv: 'arbetsblock',
    de: 'Arbeitsblöcke',
  },
  'dashboard.vsNonValueShare': {
    en: 'non-value',
    da: 'ikke-værdi',
    sv: 'icke-värde',
    de: 'Nicht-Wert',
  },
  'dashboard.vsTopSystemConditions': {
    en: 'Biggest system conditions driving this step',
    da: 'Største systemforhold der driver dette trin',
    sv: 'Största systemvillkor som driver detta steg',
    de: 'Größte Systembedingungen hinter diesem Schritt',
  },
  'dashboard.vsNoSystemConditions': {
    en: 'No system conditions tagged on this step’s work yet.',
    da: 'Ingen systemforhold registreret på arbejdet i dette trin endnu.',
    sv: 'Inga systemvillkor registrerade på arbetet i detta steg ännu.',
    de: 'Noch keine Systembedingungen an der Arbeit dieses Schritts erfasst.',
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
  // Plain-words consequences of a merge, appended to the heading ⓘ (2026-07-10).
  'synthesis.mergeConsequences': {
    en: 'What merging does: it keeps one name and folds the others into it. Every record already labelled with the folded-in names is moved onto the kept name — nothing is deleted, and their counts combine under it. The folded-in names then disappear from the capture pickers and lists, so everyone uses the one shared name from now on. This affects only this study, and you can undo any merge from the list below.',
    da: 'Hvad en sammenlægning gør: den beholder ét navn og lægger de andre ind under det. Alle poster, der allerede er mærket med de indlagte navne, flyttes over på det bevarede navn — intet slettes, og deres antal lægges sammen under det. De indlagte navne forsvinder derefter fra opfangnings-vælgerne og listerne, så alle bruger det ene fælles navn fremover. Dette påvirker kun denne undersøgelse, og du kan fortryde enhver sammenlægning fra listen nedenfor.',
    sv: 'Vad en sammanslagning gör: den behåller ett namn och fogar in de andra under det. Alla poster som redan är märkta med de infogade namnen flyttas till det behållna namnet — inget raderas, och deras antal slås samman under det. De infogade namnen försvinner sedan från fångst-väljarna och listorna, så att alla använder det enda gemensamma namnet framöver. Detta påverkar endast denna studie, och du kan ångra vilken sammanslagning som helst från listan nedan.',
    de: 'Was das Zusammenführen bewirkt: Ein Name bleibt erhalten, die anderen werden ihm zugeordnet. Jeder bereits mit den zusammengeführten Namen gekennzeichnete Datensatz wird auf den behaltenen Namen übertragen — nichts wird gelöscht, und ihre Anzahl wird darunter zusammengezählt. Die zusammengeführten Namen verschwinden dann aus den Erfassungs-Auswahlen und Listen, sodass fortan alle den einen gemeinsamen Namen verwenden. Dies betrifft nur diese Studie, und Sie können jede Zusammenführung über die Liste unten rückgängig machen.',
  },
  'synthesis.distributionTitle': {
    en: 'How often each appears',
    da: 'Hvor ofte hver enkelt optræder',
    sv: 'Hur ofta var och en förekommer',
    de: 'Wie häufig jedes vorkommt',
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
    en: 'Work blocks',
    da: 'Arbejdsblokke',
    sv: 'Arbetsblock',
    de: 'Arbeitsblöcke',
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
    en: 'Synthesise work blocks',
    da: 'Syntetisér arbejdsblokke',
    sv: 'Syntetisera arbetsblock',
    de: 'Arbeitsblöcke zusammenführen',
  },
  'synthesis.wstIntro': {
    en: 'As you study the captured work blocks, you will find labels that are really the same block of work. Judge each against the others — Same, Similar or Different — and merge the sames and similars onto one agreed name. The change ripples back through every work block already labelled with them.',
    da: 'Når du studerer de opfangede arbejdsblokke, vil du finde betegnelser, der reelt er samme arbejdsblok. Vurdér hver enkelt mod de andre — Samme, Lignende eller Forskellige — og slå de samme og lignende sammen til ét aftalt navn. Ændringen slår igennem på alle de arbejdsblokke, der allerede er mærket med dem.',
    sv: 'När du studerar de fångade arbetsblocken hittar du beteckningar som egentligen är samma arbetsblock. Bedöm varje mot de andra — Samma, Liknande eller Olika — och slå ihop de samma och liknande till ett överenskommet namn. Ändringen slår igenom på alla arbetsblock som redan är märkta med dem.',
    de: 'Beim Studieren der erfassten Arbeitsblöcke finden Sie Bezeichnungen, die eigentlich derselbe Arbeitsblock sind. Beurteilen Sie jeden im Vergleich zu den anderen — Gleich, Ähnlich oder Verschieden — und führen Sie die gleichen und ähnlichen unter einem vereinbarten Namen zusammen. Die Änderung wirkt sich auf alle bereits damit gekennzeichneten Arbeitsblöcke aus.',
  },
  'synthesis.wstEmpty': {
    en: 'No work blocks captured yet.',
    da: 'Der er endnu ikke opfanget nogen arbejdsblokke.',
    sv: 'Inga arbetsblock har fångats ännu.',
    de: 'Noch keine Arbeitsblöcke erfasst.',
  },
  // Demand-type synthesis (migration 0063). Canonical DA/SV terms per CLAUDE.md —
  // never "fejlefterspørgsel" / "felefterfrågan". da/sv/de pending Jonas's approval.
  'synthesis.taxVd': {
    en: 'Value demand',
    da: 'Værdiskabende efterspørgsel',
    sv: 'Värdeskapande efterfrågan',
    de: 'Wert-Nachfrage',
  },
  'synthesis.taxFd': {
    en: 'Failure demand',
    da: 'Ikke-værdiskabende efterspørgsel',
    sv: 'Icke-värdeskapande efterfrågan',
    de: 'Fehlernachfrage',
  },
  'synthesis.vdHeading': {
    en: 'Synthesise value demands',
    da: 'Syntetisér værdiskabende efterspørgsel',
    sv: 'Syntetisera värdeskapande efterfrågan',
    de: 'Wert-Nachfrage zusammenführen',
  },
  'synthesis.vdIntro': {
    en: 'As you study the captured value demands, you will find labels that are really the same demand said differently. Judge each against the others — Same, Similar or Different — and merge the sames and similars onto one agreed name. The change ripples back through every case and record already labelled with them.',
    da: 'Når du studerer den opfangede værdiskabende efterspørgsel, vil du finde betegnelser, der reelt er samme efterspørgsel sagt på en anden måde. Vurdér hver enkelt mod de andre — Samme, Lignende eller Forskellige — og slå de samme og lignende sammen til ét aftalt navn. Ændringen slår igennem på alle de sager og poster, der allerede er mærket med dem.',
    sv: 'När du studerar den fångade värdeskapande efterfrågan hittar du beteckningar som egentligen är samma efterfrågan uttryckt på ett annat sätt. Bedöm varje mot de andra — Samma, Liknande eller Olika — och slå ihop de samma och liknande till ett överenskommet namn. Ändringen slår igenom på alla ärenden och poster som redan är märkta med dem.',
    de: 'Beim Studieren der erfassten Wert-Nachfrage finden Sie Bezeichnungen, die eigentlich dieselbe Nachfrage anders ausgedrückt sind. Beurteilen Sie jede im Vergleich zu den anderen — Gleich, Ähnlich oder Verschieden — und führen Sie die gleichen und ähnlichen unter einem vereinbarten Namen zusammen. Die Änderung wirkt sich auf alle bereits damit gekennzeichneten Fälle und Datensätze aus.',
  },
  'synthesis.vdEmpty': {
    en: 'No value demands captured yet.',
    da: 'Der er endnu ikke opfanget nogen værdiskabende efterspørgsel.',
    sv: 'Ingen värdeskapande efterfrågan har fångats ännu.',
    de: 'Noch keine Wert-Nachfrage erfasst.',
  },
  'synthesis.fdHeading': {
    en: 'Synthesise failure demands',
    da: 'Syntetisér ikke-værdiskabende efterspørgsel',
    sv: 'Syntetisera icke-värdeskapande efterfrågan',
    de: 'Fehlernachfrage zusammenführen',
  },
  'synthesis.fdIntro': {
    en: 'As you study the captured failure demands, you will find labels that are really the same demand said differently. Judge each against the others — Same, Similar or Different — and merge the sames and similars onto one agreed name. The change ripples back through every case and record already labelled with them.',
    da: 'Når du studerer den opfangede ikke-værdiskabende efterspørgsel, vil du finde betegnelser, der reelt er samme efterspørgsel sagt på en anden måde. Vurdér hver enkelt mod de andre — Samme, Lignende eller Forskellige — og slå de samme og lignende sammen til ét aftalt navn. Ændringen slår igennem på alle de sager og poster, der allerede er mærket med dem.',
    sv: 'När du studerar den fångade icke-värdeskapande efterfrågan hittar du beteckningar som egentligen är samma efterfrågan uttryckt på ett annat sätt. Bedöm varje mot de andra — Samma, Liknande eller Olika — och slå ihop de samma och liknande till ett överenskommet namn. Ändringen slår igenom på alla ärenden och poster som redan är märkta med dem.',
    de: 'Beim Studieren der erfassten Fehlernachfrage finden Sie Bezeichnungen, die eigentlich dieselbe Nachfrage anders ausgedrückt sind. Beurteilen Sie jede im Vergleich zu den anderen — Gleich, Ähnlich oder Verschieden — und führen Sie die gleichen und ähnlichen unter einem vereinbarten Namen zusammen. Die Änderung wirkt sich auf alle bereits damit gekennzeichneten Fälle und Datensätze aus.',
  },
  'synthesis.fdEmpty': {
    en: 'No failure demands captured yet.',
    da: 'Der er endnu ikke opfanget nogen ikke-værdiskabende efterspørgsel.',
    sv: 'Ingen icke-värdeskapande efterfrågan har fångats ännu.',
    de: 'Noch keine Fehlernachfrage erfasst.',
  },
  // Life-problem + what-matters synthesis (migration 0064). Concept nouns reuse
  // the canonical capture.lifeProblemLabel / capture.whatMattersHeader strings;
  // intros mirror the operational phrasing of synthesis.wtIntro. da/sv/de drafts.
  'synthesis.taxLp': {
    en: 'Life problems',
    da: 'Livsproblemer',
    sv: 'Livsproblem',
    de: 'Lebensprobleme',
  },
  'synthesis.taxWm': {
    en: 'What matters',
    da: 'Hvad betyder noget',
    sv: 'Vad är viktigt',
    de: 'Was wichtig ist',
  },
  'synthesis.lpHeading': {
    en: 'Synthesise life problems',
    da: 'Syntetisér livsproblemer',
    sv: 'Syntetisera livsproblem',
    de: 'Lebensprobleme zusammenführen',
  },
  'synthesis.lpIntro': {
    en: 'As you study the captured life problems, you will find labels that are really the same life problem said differently. Judge each against the others — Same, Similar or Different — and merge the sames and similars onto one agreed name. The change ripples back through every case and record already labelled with them.',
    da: 'Når du studerer de opfangede livsproblemer, vil du finde betegnelser, der reelt er samme livsproblem sagt på en anden måde. Vurdér hver enkelt mod de andre — Samme, Lignende eller Forskellige — og slå de samme og lignende sammen til ét aftalt navn. Ændringen slår igennem på alle de sager og poster, der allerede er mærket med dem.',
    sv: 'När du studerar de fångade livsproblemen hittar du beteckningar som egentligen är samma livsproblem uttryckt på ett annat sätt. Bedöm varje mot de andra — Samma, Liknande eller Olika — och slå ihop de samma och liknande till ett överenskommet namn. Ändringen slår igenom på alla ärenden och poster som redan är märkta med dem.',
    de: 'Beim Studieren der erfassten Lebensprobleme finden Sie Bezeichnungen, die eigentlich dasselbe Lebensproblem anders ausgedrückt sind. Beurteilen Sie jedes im Vergleich zu den anderen — Gleich, Ähnlich oder Verschieden — und führen Sie die gleichen und ähnlichen unter einem vereinbarten Namen zusammen. Die Änderung wirkt sich auf alle bereits damit gekennzeichneten Fälle und Datensätze aus.',
  },
  'synthesis.lpEmpty': {
    en: 'No life problems captured yet.',
    da: 'Der er endnu ikke opfanget nogen livsproblemer.',
    sv: 'Inga livsproblem har fångats ännu.',
    de: 'Noch keine Lebensprobleme erfasst.',
  },
  'synthesis.wmHeading': {
    en: 'Synthesise what matters',
    da: 'Syntetisér "hvad betyder noget"',
    sv: 'Syntetisera "vad är viktigt"',
    de: '"Was wichtig ist" zusammenführen',
  },
  'synthesis.wmIntro': {
    en: 'As you study what customers said matters, you will find labels that are really the same thing said differently. Judge each against the others — Same, Similar or Different — and merge the sames and similars onto one agreed name. The change ripples back through every case and record already labelled with them.',
    da: 'Når du studerer det, kunderne sagde betyder noget, vil du finde betegnelser, der reelt er det samme sagt på en anden måde. Vurdér hver enkelt mod de andre — Samme, Lignende eller Forskellige — og slå de samme og lignende sammen til ét aftalt navn. Ændringen slår igennem på alle de sager og poster, der allerede er mærket med dem.',
    sv: 'När du studerar det som kunderna sa är viktigt hittar du beteckningar som egentligen är samma sak uttryckt på ett annat sätt. Bedöm varje mot de andra — Samma, Liknande eller Olika — och slå ihop de samma och liknande till ett överenskommet namn. Ändringen slår igenom på alla ärenden och poster som redan är märkta med dem.',
    de: 'Beim Studieren dessen, was Kunden als wichtig nannten, finden Sie Bezeichnungen, die eigentlich dasselbe anders ausgedrückt sind. Beurteilen Sie jede im Vergleich zu den anderen — Gleich, Ähnlich oder Verschieden — und führen Sie die gleichen und ähnlichen unter einem vereinbarten Namen zusammen. Die Änderung wirkt sich auf alle bereits damit gekennzeichneten Fälle und Datensätze aus.',
  },
  'synthesis.wmEmpty': {
    en: 'No what-matters factors captured yet.',
    da: 'Der er endnu ikke opfanget nogen "hvad betyder noget"-faktorer.',
    sv: 'Inga "vad är viktigt"-faktorer har fångats ännu.',
    de: 'Noch keine "Was wichtig ist"-Faktoren erfasst.',
  },
  'dashboard.capabilityLeadTime': {
    en: 'Capability — E2E time between events',
    da: 'Kapabilitet — E2E-tid mellem hændelser',
    sv: 'Kapabilitet — E2E-tid mellan händelser',
    de: 'Kapabilität — E2E-Zeit zwischen Ereignissen',
  },
  // E2E exclusion of "When I want it" cases (2026-07-03).
  'dashboard.leadTimeExcludeHelp': {
    en: 'End-to-end time measures how long the work took, so it only counts customers who wanted it as soon as possible. Customers who chose a specific date ("When I want it") aren’t shown here — for them, hitting the date is what matters, so use the days early / late measure instead.',
    da: 'E2E-tid måler, hvor lang tid arbejdet tog, så den tæller kun kunder, der ville have det så hurtigt som muligt. Kunder, der valgte en bestemt dato ("Hvornår jeg vil have det"), vises ikke her — for dem handler det om at ramme datoen, så brug i stedet målet dage før / efter.',
    sv: 'E2E-tid mäter hur lång tid arbetet tog, så den räknar bara kunder som ville ha det så snart som möjligt. Kunder som valde ett specifikt datum ("När jag vill ha det") visas inte här — för dem handlar det om att träffa datumet, så använd måttet dagar tidigt / sent i stället.',
    de: 'Die E2E-Zeit misst, wie lange die Arbeit gedauert hat, und zählt daher nur Kunden, die es so schnell wie möglich wollten. Kunden, die ein bestimmtes Datum gewählt haben ("Wann ich es möchte"), werden hier nicht angezeigt — für sie zählt das Einhalten des Datums, nutzen Sie stattdessen das Maß Tage früher / später.',
  },
  'dashboard.leadTimeExcludedCount': {
    en: '{count} customer(s) who wanted it by a set date are not shown.',
    da: '{count} kunde(r), der ville have det på en bestemt dato, vises ikke.',
    sv: '{count} kund(er) som ville ha det ett bestämt datum visas inte.',
    de: '{count} Kunde(n), die es zu einem festen Datum wollten, werden nicht angezeigt.',
  },
  'dashboard.leadTimeExcludedBanner': {
    en: '{count} customer(s) wanted it by a set date, so end-to-end time isn’t their measure — they’re measured on whether we hit their date.',
    da: '{count} kunde(r) ville have det på en bestemt dato, så E2E-tid er ikke deres mål — de måles på, om vi rammer deres dato.',
    sv: '{count} kund(er) ville ha det ett bestämt datum, så E2E-tid är inte deras mått — de mäts på om vi träffar deras datum.',
    de: '{count} Kunde(n) wollten es zu einem festen Datum, daher ist die E2E-Zeit nicht ihr Maß — sie werden daran gemessen, ob wir ihr Datum einhalten.',
  },
  'dashboard.leadTimeSeeDateMeasure': {
    en: 'See how we met their date →',
    da: 'Se hvordan vi ramte deres dato →',
    sv: 'Se hur vi träffade deras datum →',
    de: 'Sehen, wie wir ihr Datum eingehalten haben →',
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
    en: 'First contact (case opened)',
    da: 'Første kontakt (sag åbnet)',
    sv: 'Första kontakt (ärende öppnat)',
    de: 'Erster Kontakt (Fall eröffnet)',
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
  'dashboard.corWorkFilter': {
    en: 'Work type',
    da: 'Arbejdstype',
    sv: 'Arbetstyp',
    de: 'Arbeitstyp',
  },
  // Short forms for the on-chart reference-line labels (the tiles below spell them out).
  'dashboard.uclShort': {
    en: 'UCL',
    da: 'ØKG',
    sv: 'ÖKG',
    de: 'OKG',
  },
  'dashboard.lclShort': {
    en: 'LCL',
    da: 'NKG',
    sv: 'NKG',
    de: 'UKG',
  },
  'dashboard.avgShort': {
    en: 'Av',
    da: 'Gns.',
    sv: 'Medel',
    de: 'Ø',
  },
  'dashboard.signals': {
    en: 'Special-cause cases',
    da: 'Speciel årsagsvariation',
    sv: 'Speciella orsaker',
    de: 'Spezielle Ursachen',
  },
  'dashboard.leadTimeDays': {
    en: 'E2E time (days)',
    da: 'E2E-tid (dage)',
    sv: 'E2E-tid (dagar)',
    de: 'E2E-Zeit (Tage)',
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
    en: 'E2E time',
    da: 'E2E-tid',
    sv: 'E2E-tid',
    de: 'E2E-Zeit',
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
  'dashboard.scopeWhatMattersHelp': {
    en: 'Scopes the end-to-end charts below to customers who chose this timing.',
    da: 'Afgrænser E2E-graferne nedenfor til kunder, der valgte denne timing.',
    sv: 'Avgränsar E2E-diagrammen nedan till kunder som valde denna timing.',
    de: 'Grenzt die E2E-Diagramme unten auf Kunden mit dieser Zeitvorgabe ein.',
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
  'dashboard.wmMetTheirDate': {
    en: 'met their date',
    da: 'ramte deres dato',
    sv: 'träffade deras datum',
    de: 'ihr Datum eingehalten',
  },
  'dashboard.wmAvgDaysEarly': {
    en: 'Avg days early',
    da: 'Gns. dage før',
    sv: 'Snitt dagar tidigt',
    de: 'Ø Tage früher',
  },
  'dashboard.wmTypicalTime': {
    en: 'typical time, case open → completion',
    da: 'typisk tid, sagsåbning → afslutning',
    sv: 'typisk tid, ärendet öppnas → slutfört',
    de: 'typische Zeit, Fallöffnung → Abschluss',
  },
  'dashboard.wmMeanRange': {
    en: 'mean {mean} · range {min}–{max}',
    da: 'gns. {mean} · spænd {min}–{max}',
    sv: 'snitt {mean} · spann {min}–{max}',
    de: 'Ø {mean} · Spanne {min}–{max}',
  },
  'dashboard.wmInProgress': {
    en: 'in progress',
    da: 'i gang',
    sv: 'pågående',
    de: 'in Arbeit',
  },
  'dashboard.wmNoDate': {
    en: 'no date set',
    da: 'ingen dato angivet',
    sv: 'inget datum satt',
    de: 'kein Datum gesetzt',
  },
  'dashboard.wmNoneScored': {
    en: 'No completed cases to score yet.',
    da: 'Ingen afsluttede sager at vurdere endnu.',
    sv: 'Inga slutförda ärenden att bedöma ännu.',
    de: 'Noch keine abgeschlossenen Fälle zum Bewerten.',
  },
  'dashboard.touchesPerCase': {
    en: 'Touches per case',
    da: 'Registreringer pr. sag',
    sv: 'Poster per ärende',
    de: 'Einträge pro Fall',
  },
  'dashboard.touchesPerCaseTitle': {
    en: 'Touches per case (XmR)',
    da: 'Registreringer pr. sag (XmR)',
    sv: 'Poster per ärende (XmR)',
    de: 'Einträge pro Fall (XmR)',
  },
  'dashboard.stepsPerCaseTitle': {
    en: 'Blocks of work per case (XmR)',
    da: 'Arbejdsblokke pr. sag (XmR)',
    sv: 'Arbetsblock per ärende (XmR)',
    de: 'Arbeitsblöcke pro Fall (XmR)',
  },
  'dashboard.stepTotal': {
    en: 'Total blocks',
    da: 'Blokke i alt',
    sv: 'Block totalt',
    de: 'Blöcke gesamt',
  },
  // Parenthetical on the per-tag XmR chart titles, e.g. "Value (work block)".
  'dashboard.workBlockParen': {
    en: 'work block',
    da: 'arbejdsblok',
    sv: 'arbetsblock',
    de: 'Arbeitsblock',
  },
  'dashboard.valueStepAll': {
    en: 'All value steps',
    da: 'Alle værditrin',
    sv: 'Alla värdesteg',
    de: 'Alle Wertschritte',
  },
  'dashboard.touchesUpToStep': {
    en: 'Touches up to completing “{step}”',
    da: 'Registreringer frem til afslutning af “{step}”',
    sv: 'Poster fram till slutfört “{step}”',
    de: 'Einträge bis zum Abschluss von „{step}“',
  },
  // "How it's calculated" explainers (2026-07-08), one per flow-dashboard measure.
  'dashboard.calcTouchesPerCase': {
    en: 'One point per case = the number of touches (saved work entries) on that case, plotted in case-open order. Centre line = the mean; limits = mean ± 2.66 × the average moving range (an XmR chart). Choose a value step to count only touches up to that case’s last touch on the step.',
    da: 'Ét punkt pr. sag = antal registreringer (gemte arbejdsposter) på sagen, vist i rækkefølge efter sagsåbning. Midterlinje = gennemsnit; grænser = gennemsnit ± 2,66 × gennemsnitligt glidende interval (et XmR-kort). Vælg et værditrin for kun at tælle registreringer frem til sagens sidste registrering på trinnet.',
    sv: 'En punkt per ärende = antal poster (sparade arbetsposter) på ärendet, i ordning efter ärendets öppning. Mittlinje = medelvärde; gränser = medelvärde ± 2,66 × genomsnittligt glidande intervall (ett XmR-diagram). Välj ett värdesteg för att bara räkna poster fram till ärendets sista post på steget.',
    de: 'Ein Punkt pro Fall = Anzahl der Einträge (gespeicherte Arbeitseinträge) des Falls, in Reihenfolge der Fallöffnung. Mittellinie = Mittelwert; Grenzen = Mittelwert ± 2,66 × durchschnittliche gleitende Spannweite (XmR).',
  },
  'dashboard.calcStepsPerCase': {
    en: 'One point per case = the number of work blocks of the chosen type (or that type as a % of the case’s blocks), in case-open order, with XmR limits (mean ± 2.66 × the average moving range). A block is one tagged block of work; choose a value step to count only blocks tagged to it.',
    da: 'Ét punkt pr. sag = antal arbejdsblokke af den valgte type (eller typens andel i % af sagens blokke), i rækkefølge efter sagsåbning, med XmR-grænser (gennemsnit ± 2,66 × gennemsnitligt glidende interval). En blok er én markeret arbejdsblok; vælg et værditrin for kun at tælle blokke markeret dertil.',
    sv: 'En punkt per ärende = antal arbetsblock av vald typ (eller typens andel i % av ärendets block), i ordning efter ärendets öppning, med XmR-gränser (medelvärde ± 2,66 × genomsnittligt glidande intervall). Ett block är ett märkt arbetsblock; välj ett värdesteg för att bara räkna block märkta dit.',
    de: 'Ein Punkt pro Fall = Anzahl der Arbeitsblöcke des gewählten Typs (oder dessen Anteil in % der Blöcke des Falls), in Reihenfolge der Fallöffnung, mit XmR-Grenzen (Mittelwert ± 2,66 × durchschnittliche gleitende Spannweite).',
  },
  'dashboard.calcWorkByValueStep': {
    en: 'Counts each work block by its tag (value, sequence, failure work, failure demand) and groups them by the value step it was tagged to. Sort to rank value steps by a waste type, or keep journey order.',
    da: 'Tæller hver arbejdsblok efter dens mærkat (værdiskabende, sekvens, ikke-værdiskabende arbejde, ikke-værdiskabende efterspørgsel) og grupperer efter det værditrin, den er markeret til. Sortér for at rangere værditrin efter en spildtype, eller behold rejsens rækkefølge.',
    sv: 'Räknar varje arbetsblock efter dess märkning (värdeskapande, sekvens, icke-värdeskapande arbete, icke-värdeskapande efterfrågan) och grupperar efter det värdesteg det märkts till. Sortera för att rangordna värdesteg efter en slöserityp, eller behåll resans ordning.',
    de: 'Zählt jeden Arbeitsblock nach seiner Markierung (Wert, Sequenz, Fehlerarbeit, Fehlerbedarf) und gruppiert sie nach dem zugeordneten Wertschritt. Sortieren, um Wertschritte nach Verschwendungsart zu ordnen, oder Reihenfolge der Reise behalten.',
  },
  'dashboard.calcValueStepOverview': {
    en: 'Per value step: its work-block counts by tag, the non-value share (sequence + failure work + failure demand ÷ all its blocks), and the system conditions most often tagged on those blocks.',
    da: 'Pr. værditrin: antal arbejdsblokke efter mærkat, den ikke-værdiskabende andel (sekvens + ikke-værdiskabende arbejde + ikke-værdiskabende efterspørgsel ÷ alle blokke) og de systemforhold, der oftest er markeret på blokkene.',
    sv: 'Per värdesteg: antal arbetsblock efter märkning, den icke-värdeskapande andelen (sekvens + icke-värdeskapande arbete + icke-värdeskapande efterfrågan ÷ alla block) och de systemvillkor som oftast märkts på blocken.',
    de: 'Pro Wertschritt: Arbeitsblock-Zahlen nach Markierung, der Nicht-Wert-Anteil (Sequenz + Fehlerarbeit + Fehlerbedarf ÷ alle Blöcke) und die am häufigsten markierten Systembedingungen.',
  },
  'dashboard.calcFlowFailureDemand': {
    en: 'Counts work blocks tagged as failure demand, grouped by failure-demand type, across the cases in scope (the value-demand filter applies).',
    da: 'Tæller arbejdsblokke markeret som ikke-værdiskabende efterspørgsel, grupperet efter type, på tværs af sagerne i udsnittet (værdiskabende-efterspørgsel-filteret gælder).',
    sv: 'Räknar arbetsblock märkta som icke-värdeskapande efterfrågan, grupperade efter typ, över ärendena i urvalet (värdeskapande-efterfrågan-filtret gäller).',
    de: 'Zählt als Fehlerbedarf markierte Arbeitsblöcke, gruppiert nach Typ, über die Fälle im Umfang (der Wertbedarf-Filter gilt).',
  },
  'dashboard.calcValueCreationCapability': {
    en: 'Counts flow work entries by the value-creation-capability judgement recorded on each (Value Created / Value Maintained / Missed Opportunity), as a share of answered entries, across the cases in scope (the value-demand filter applies).',
    da: 'Tæller flow-arbejdsindtastninger efter den vurdering af evne til værdiskabelse, der er registreret på hver (Værdi skabt / Værdi fastholdt / Forpasset mulighed), som andel af besvarede indtastninger, på tværs af sagerne i udsnittet (værdiskabende-efterspørgsel-filteret gælder).',
    sv: 'Räknar flödesarbetsposter efter den värdeskapandekapabilitet-bedömning som registrerats på varje (Värde skapat / Värde bibehållet / Missad möjlighet), som andel av besvarade poster, över ärendena i urvalet (värdeskapande-efterfrågan-filtret gäller).',
    de: 'Zählt Flow-Arbeitseinträge nach der auf jedem erfassten Wertschöpfungsfähigkeits-Bewertung (Wert geschaffen / Wert erhalten / Verpasste Gelegenheit) als Anteil der beantworteten Einträge, über die Fälle im Umfang (der Wertbedarf-Filter gilt).',
  },
  'dashboard.calcCor': {
    en: 'The mix of Capability-of-Response outcomes recorded on the cases in scope, as a share of the total.',
    da: 'Fordelingen af registrerede Capability-of-Response-udfald på sagerne i udsnittet, som andel af totalen.',
    sv: 'Fördelningen av registrerade Capability-of-Response-utfall på ärendena i urvalet, som andel av totalen.',
    de: 'Die Verteilung der erfassten Capability-of-Response-Ergebnisse der Fälle im Umfang, als Anteil an der Gesamtzahl.',
  },
  'dashboard.calcBudget': {
    en: 'Per case that has a budget ask and a recorded amount: the signed variance (delivered − budget), shown as % of budget or as an amount, in answer order, with XmR limits.',
    da: 'Pr. sag med et budgetønske og et registreret beløb: den fortegnede afvigelse (leveret − budget), vist som % af budget eller som beløb, i svarrækkefølge, med XmR-grænser.',
    sv: 'Per ärende med ett budgetönskemål och ett registrerat belopp: den tecknade avvikelsen (levererat − budget), som % av budget eller som belopp, i svarsordning, med XmR-gränser.',
    de: 'Pro Fall mit Budgetwunsch und erfasstem Betrag: die vorzeichenbehaftete Abweichung (geliefert − Budget), als % des Budgets oder als Betrag, in Antwortreihenfolge, mit XmR-Grenzen.',
  },
  'dashboard.calcAskDelivery': {
    en: 'How well we delivered on each thing the customer said mattered, through up to two lenses. “By when the case completed”: for a timed factor, the share of cases that finished on or before the wanted date (“When I want it”) or the typical time from case open to completion (“As soon as possible”), measured to the factor’s completion event (or case close). “By the captured decision value”: for an ask linked to a factor, of the cases that recorded both the ask and a decision value, how many were met — and for dates, how many were late and by how many days on average. The value-demand filter and date range apply.',
    da: 'Hvor godt vi leverede på hver ting, kunden sagde betød noget, gennem op til to perspektiver. “Efter hvornår sagen blev afsluttet”: for en tidsbestemt faktor, andelen af sager, der blev færdige på eller før den ønskede dato (“Hvornår jeg vil have det”), eller den typiske tid fra sagsåbning til afslutning (“Så hurtigt som muligt”), målt til faktorens afslutningshændelse (eller sagslukning). “Efter den registrerede beslutningsværdi”: for et ønske knyttet til en faktor, af de sager der registrerede både ønsket og en beslutningsværdi, hvor mange blev opfyldt — og for datoer, hvor mange var forsinkede og med hvor mange dage i gennemsnit. Værdiskabende-efterspørgsel-filteret og datointervallet gælder.',
    sv: 'Hur väl vi levererade på varje sak kunden sa var viktig, genom upp till två perspektiv. “Efter när ärendet slutfördes”: för en tidsbestämd faktor, andelen ärenden som blev klara på eller före önskat datum (“När jag vill ha det”), eller den typiska tiden från ärendets öppning till slutförande (“Så snart som möjligt”), mätt till faktorns slutförandehändelse (eller ärendets stängning). “Efter det registrerade beslutsvärdet”: för ett önskemål kopplat till en faktor, av de ärenden som registrerade både önskemålet och ett beslutsvärde, hur många uppfylldes — och för datum, hur många var sena och med hur många dagar i snitt. Värdeskapande-efterfrågan-filtret och datumintervallet gäller.',
    de: 'Wie gut wir jede Sache erfüllt haben, die dem Kunden wichtig war, durch bis zu zwei Perspektiven. „Nach dem Abschlusszeitpunkt des Falls“: für einen zeitbezogenen Faktor der Anteil der Fälle, die am oder vor dem gewünschten Datum abgeschlossen wurden („Wann ich es möchte“), oder die typische Zeit von Fallöffnung bis Abschluss („So schnell wie möglich“), gemessen bis zum Abschlussereignis des Faktors (oder Fallabschluss). „Nach dem erfassten Entscheidungswert“: für einen mit einem Faktor verknüpften Wunsch, von den Fällen mit Wunsch und Entscheidungswert, wie viele erfüllt wurden — und bei Datumsangaben, wie viele verspätet waren und um wie viele Tage im Schnitt. Der Wertbedarf-Filter und der Datumsbereich gelten.',
  },
  'dashboard.p2bsVdTitle': {
    en: 'Life problems → value demands',
    da: 'Livsproblemer → værdiskabende efterspørgsel',
    sv: 'Livsproblem → värdeskapande efterfrågan',
    de: 'Lebensprobleme → Wert-Nachfrage',
  },
  'dashboard.p2bsVdQuestion': {
    en: 'What problem(s) is the customer really trying to solve by placing this value demand on us?',
    da: 'Hvilke(t) problem(er) forsøger kunden i virkeligheden at løse ved at placere denne værdiskabende efterspørgsel hos os?',
    sv: 'Vilket eller vilka problem försöker kunden egentligen lösa genom att lägga denna värdeskapande efterfrågan hos oss?',
    de: 'Welche(s) Problem(e) versucht der Kunde wirklich zu lösen, wenn er diese Wert-Nachfrage an uns richtet?',
  },
  'dashboard.calcP2bsVd': {
    en: 'Links each life problem to be solved (left) to the value demands (right) recorded on the same cases. Band width = the number of cases in scope carrying both; a case with several of either counts once per combination. Grey “Not set” collects cases missing that side. The date range (case opened) and the value-demand filter apply. Click a band to see the cases behind it and their “what matters” words.',
    da: 'Kobler hvert livsproblem der skal løses (venstre) til den værdiskabende efterspørgsel (højre), der er registreret på de samme sager. Båndets bredde = antal sager i udsnittet med begge; en sag med flere af hver tæller én gang pr. kombination. Gråt “Ikke angivet” samler sager, der mangler den side. Datointerval (sagsåbning) og værdiskabende-efterspørgsel-filteret gælder. Klik på et bånd for at se sagerne bag det og deres “det der betyder noget”-ord.',
    sv: 'Kopplar varje livsproblem som ska lösas (vänster) till den värdeskapande efterfrågan (höger) som registrerats på samma ärenden. Bandets bredd = antal ärenden i urvalet med båda; ett ärende med flera av endera räknas en gång per kombination. Grått “Ej angivet” samlar ärenden som saknar den sidan. Datumintervallet (ärendets öppning) och värdeskapande-efterfrågan-filtret gäller. Klicka på ett band för att se ärendena bakom det och deras “det som betyder något”-ord.',
    de: 'Verknüpft jedes zu lösende Lebensproblem (links) mit der Wert-Nachfrage (rechts), die auf denselben Fällen erfasst ist. Bandbreite = Anzahl der Fälle im Umfang mit beidem; ein Fall mit mehreren von beiden zählt einmal pro Kombination. Graues „Nicht angegeben“ sammelt Fälle, denen die Seite fehlt. Datumsbereich (Fallöffnung) und Wertbedarf-Filter gelten. Ein Klick auf ein Band zeigt die Fälle dahinter und ihre „Was zählt“-Worte.',
  },
  'dashboard.p2bsVdClickHint': {
    en: 'Click a band to see the cases behind it and their “what matters” words',
    da: 'Klik på et bånd for at se sagerne bag det og deres “det der betyder noget”-ord',
    sv: 'Klicka på ett band för att se ärendena bakom det och deras “det som betyder något”-ord',
    de: 'Ein Klick auf ein Band zeigt die Fälle dahinter und ihre „Was zählt“-Worte',
  },
  'dashboard.p2bsVdNotSet': {
    en: 'Not set',
    da: 'Ikke angivet',
    sv: 'Ej angivet',
    de: 'Nicht angegeben',
  },
  'dashboard.p2bsVdDetailTitle': {
    en: 'Cases behind this link',
    da: 'Sager bag denne kobling',
    sv: 'Ärenden bakom denna koppling',
    de: 'Fälle hinter dieser Verknüpfung',
  },
  'dashboard.p2bsVdDetailEmpty': {
    en: 'No “what matters” words recorded on these cases yet.',
    da: 'Ingen “det der betyder noget”-ord registreret på disse sager endnu.',
    sv: 'Inga “det som betyder något”-ord registrerade på dessa ärenden ännu.',
    de: 'Noch keine „Was zählt“-Worte auf diesen Fällen erfasst.',
  },
  'dashboard.p2bsVdEmpty': {
    en: 'No case in scope has a life problem or value demand yet. Set them in the green case box during capture.',
    da: 'Ingen sag i udsnittet har et livsproblem eller en værdiskabende efterspørgsel endnu. Angiv dem i den grønne sagsboks under registreringen.',
    sv: 'Inget ärende i urvalet har ett livsproblem eller en värdeskapande efterfrågan ännu. Ange dem i den gröna ärenderutan under registreringen.',
    de: 'Kein Fall im Umfang hat bisher ein Lebensproblem oder eine Wert-Nachfrage. Beide werden in der grünen Fallbox bei der Erfassung gesetzt.',
  },
  'dashboard.calcEndToEnd': {
    en: 'Per case: the whole-day time between the two chosen events (or the count of touches, or days early/late vs the customer’s date), in start-date order, with XmR limits (mean ± 2.66 × the average moving range). Excluded points stay visible but don’t move the limits.',
    da: 'Pr. sag: tiden i hele dage mellem de to valgte hændelser (eller antal registreringer, eller dage før/efter kundens dato), i rækkefølge efter startdato, med XmR-grænser (gennemsnit ± 2,66 × gennemsnitligt glidende interval). Udeladte punkter vises stadig, men flytter ikke grænserne.',
    sv: 'Per ärende: tiden i hela dagar mellan de två valda händelserna (eller antal poster, eller dagar före/efter kundens datum), i ordning efter startdatum, med XmR-gränser (medelvärde ± 2,66 × genomsnittligt glidande intervall). Uteslutna punkter visas men flyttar inte gränserna.',
    de: 'Pro Fall: die ganztägige Zeit zwischen den zwei gewählten Ereignissen (oder Anzahl Einträge, oder Tage früher/später als das Kundendatum), in Reihenfolge des Startdatums, mit XmR-Grenzen. Ausgeschlossene Punkte bleiben sichtbar, verschieben die Grenzen aber nicht.',
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
  // Over-time explorer (2026-07-09): user-created scoped over-time charts.
  'dashboard.otCreate': {
    en: 'Create an over-time chart',
    da: 'Opret en graf over tid',
    sv: 'Skapa ett diagram över tid',
    de: 'Ein Verlaufsdiagramm erstellen',
  },
  'dashboard.otTitle': {
    en: 'Over-time chart',
    da: 'Graf over tid',
    sv: 'Diagram över tid',
    de: 'Verlaufsdiagramm',
  },
  'dashboard.calcOtExplorer': {
    en: 'Plots what you choose per day, within the scope you choose, as an XmR chart (centre line = the mean; limits = mean ± 2.66 × the average moving range; days outside the limits flag special-cause variation). Pick a value demand (or all data) and value steps, then a work classification or a single system condition — system conditions are listed by how often they occur, largest first. % = that day’s occurrences ÷ ALL work blocks within the chosen scope that day, so a scoped chart never mixes in data from outside its scope. Days use the block date (falling back to the entry date); the dashboard’s period applies, but not its value-demand filter — this chart’s own scope is what counts.',
    da: 'Viser det, du vælger, pr. dag inden for det udsnit, du vælger, som et XmR-kort (midterlinje = gennemsnit; grænser = gennemsnit ± 2,66 × gennemsnitligt glidende interval; dage uden for grænserne markerer speciel årsagsvariation). Vælg en værdiskabende efterspørgsel (eller alle data) og værditrin, og derefter en arbejdsklassifikation eller ét systemforhold — systemforhold vises efter, hvor ofte de forekommer, størst først. % = dagens forekomster ÷ ALLE arbejdsblokke i det valgte udsnit den dag, så en afgrænset graf aldrig blander data udefra ind. Dage bruger blokdatoen (ellers registreringsdatoen); dashboardets periode gælder, men ikke dets værdiskabende-efterspørgsel-filter — det er grafens eget udsnit, der tæller.',
    sv: 'Visar det du väljer, per dag, inom det urval du väljer, som ett XmR-diagram (mittlinje = medelvärde; gränser = medelvärde ± 2,66 × genomsnittligt glidande intervall; dagar utanför gränserna markerar speciella orsaker). Välj en värdeskapande efterfrågan (eller alla data) och värdesteg, och därefter en arbetsklassificering eller ett enskilt systemvillkor — systemvillkor listas efter hur ofta de förekommer, störst först. % = dagens förekomster ÷ ALLA arbetsblock i det valda urvalet den dagen, så ett avgränsat diagram aldrig blandar in data utifrån. Dagar använder blockdatumet (annars registreringsdatumet); dashboardens period gäller, men inte dess värdeskapande-efterfrågan-filter — det är diagrammets eget urval som räknas.',
    de: 'Zeigt das Gewählte pro Tag, innerhalb des gewählten Umfangs, als XmR-Diagramm (Mittellinie = Mittelwert; Grenzen = Mittelwert ± 2,66 × durchschnittliche gleitende Spannweite; Tage außerhalb der Grenzen markieren spezielle Ursachen). Wähle eine Wert-Nachfrage (oder alle Daten) und Wertschritte, dann eine Arbeitsklassifikation oder eine einzelne Systembedingung — Systembedingungen sind nach Häufigkeit sortiert, größte zuerst. % = Vorkommen des Tages ÷ ALLE Arbeitsblöcke im gewählten Umfang an dem Tag, sodass ein eingegrenztes Diagramm nie Daten von außerhalb einmischt. Tage nutzen das Blockdatum (sonst das Eintragsdatum); der Zeitraum des Dashboards gilt, nicht aber sein Wertbedarf-Filter — der eigene Umfang des Diagramms zählt.',
  },
  'dashboard.otScope': {
    en: 'Scope',
    da: 'Udsnit',
    sv: 'Urval',
    de: 'Umfang',
  },
  'dashboard.otDays': {
    en: 'Days',
    da: 'Dage',
    sv: 'Dagar',
    de: 'Tage',
  },
  'dashboard.otValueSteps': {
    en: 'Value steps',
    da: 'Værditrin',
    sv: 'Värdesteg',
    de: 'Wertschritte',
  },
  'dashboard.otShow': {
    en: 'Show',
    da: 'Vis',
    sv: 'Visa',
    de: 'Anzeigen',
  },
  'dashboard.otSeriesSc': {
    en: 'System condition',
    da: 'Systemforhold',
    sv: 'Systemvillkor',
    de: 'Systembedingung',
  },
  'dashboard.otPickSc': {
    en: 'Select a system condition…',
    da: 'Vælg et systemforhold…',
    sv: 'Välj ett systemvillkor…',
    de: 'Systembedingung auswählen…',
  },
  'dashboard.otHint': {
    en: 'Choose a scope and what to show, and the chart appears here.',
    da: 'Vælg et udsnit og hvad der skal vises, så kommer grafen her.',
    sv: 'Välj ett urval och vad som ska visas, så visas diagrammet här.',
    de: 'Wähle einen Umfang und was angezeigt werden soll, dann erscheint das Diagramm hier.',
  },
  'dashboard.otNoData': {
    en: 'No work in this scope yet.',
    da: 'Intet arbejde i dette udsnit endnu.',
    sv: 'Inget arbete i detta urval ännu.',
    de: 'Noch keine Arbeit in diesem Umfang.',
  },
  // R7: capability point ordering + image export.
  'dashboard.sortLabel': {
    en: 'Order',
    da: 'Rækkefølge',
    sv: 'Ordning',
    de: 'Reihenfolge',
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
  'dashboard.capabilityNotesList': {
    en: 'Notes & exclusions',
    da: 'Noter & udeladelser',
    sv: 'Noteringar & undantag',
    de: 'Notizen & Ausschlüsse',
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
  // Flow Analytics CoR pie \u2014 canonical short term (matches settings.handlingTypes);
  // flow CoR is per touch, not tied to a single point of transaction.
  'dashboard.corDistributionTitle': {
    en: 'Capability of Response',
    da: 'Reaktionskapacitet',
    sv: 'Reaktionsf\u00f6rm\u00e5ga',
    de: 'Reaktionsf\u00e4higkeit',
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
    en: 'Work Block analysis',
    da: 'Arbejdsblok-analyse',
    sv: 'Analys av arbetsblock',
    de: 'Arbeitsblock-Analyse',
  },
  'dashboard.topWorkSteps': {
    en: 'Top Work Blocks',
    da: 'Mest almindelige arbejdsblokke',
    sv: 'Vanligaste arbetsblock',
    de: 'Häufigste Arbeitsblöcke',
  },
  'dashboard.workStepByWorkType': {
    en: 'Work Blocks by Work Type',
    da: 'Arbejdsblokke pr. arbejdstype',
    sv: 'Arbetsblock per arbetstyp',
    de: 'Arbeitsblöcke nach Arbeitsart',
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
  'dashboard.valueCreationCapabilityTitle': {
    en: 'Value creation capability',
    da: 'Evne til værdiskabelse',
    sv: 'Värdeskapandekapabilitet',
    de: 'Wertschöpfungsfähigkeit',
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
    en: 'Blocks of work',
    da: 'Arbejdsblokke',
    sv: 'Arbetsblock',
    de: 'Arbeitsblöcke',
  },
  'settings.workStepsDesc': {
    en: 'A managed list of the actual blocks of work inside the Flow — each tagged Value or Failure. When enabled, Flow blocks can pick from this list instead of being free-text, so blocks aggregate across entries.',
    da: 'En styret liste over de faktiske arbejdsblokke i forløbet — hver mærket som værdiskabende eller ikke-værdiskabende. Når aktiveret kan forløbsblokke vælges fra denne liste i stedet for at være fritekst, så blokke kan aggregeres på tværs af registreringer.',
    sv: 'En hanterad lista över de faktiska arbetsblocken i flödet — vart och ett taggat som värdeskapande eller icke-värdeskapande. När aktiverat kan flödesblock väljas från denna lista istället för att vara fritext, så block kan aggregeras över registreringar.',
    de: 'Eine gepflegte Liste der tatsächlichen Arbeitsblöcke im Ablauf — jeder als Wert oder Fehler markiert. Bei aktivierter Option können Ablaufblöcke aus dieser Liste gewählt werden statt Freitext, damit Blöcke über Einträge aggregiert werden können.',
  },
  'settings.enableWorkSteps': {
    en: 'Enable work-block taxonomy',
    da: 'Aktivér taksonomi for arbejdsblokke',
    sv: 'Aktivera taxonomi för arbetsblock',
    de: 'Arbeitsblock-Taxonomie aktivieren',
  },
  'settings.addWorkStep': {
    en: 'Add work block...',
    da: 'Tilføj arbejdsblok...',
    sv: 'Lägg till arbetsblock...',
    de: 'Arbeitsblock hinzufügen...',
  },
  // Value steps (migration 0047).
  'settings.valueSteps': {
    en: 'Value Steps',
    da: 'Værditrin',
    sv: 'Värdesteg',
    de: 'Wertschritte',
  },
  'settings.valueStepsDesc': {
    en: 'The ordered stages of the customer value journey. On flow work blocks, each block is tagged with one value step — so the dashboard can show where failure and sequence work most appears.',
    da: 'De ordnede trin i kundens værdirejse. På flow-arbejdsblokke tagges hver blok med ét værditrin — så dashboardet kan vise, hvor ikke-værdiskabende og sekvensarbejde oftest optræder.',
    sv: 'De ordnade stegen i kundens värderesa. På flödesarbetsblock taggas varje block med ett värdesteg — så att dashboarden kan visa var icke-värdeskapande arbete och sekvensarbete oftast uppträder.',
    de: 'Die geordneten Phasen der Kundenwertreise. Bei Flow-Arbeitsblöcken wird jeder Block mit einem Wertschritt versehen — so zeigt das Dashboard, wo Fehler- und Sequenzarbeit am häufigsten auftreten.',
  },
  'settings.addValueStep': {
    en: 'Add value step...',
    da: 'Tilføj værditrin...',
    sv: 'Lägg till värdesteg...',
    de: 'Wertschritt hinzufügen...',
  },
  'settings.valueStepsToggle': {
    en: 'Value steps',
    da: 'Værditrin',
    sv: 'Värdesteg',
    de: 'Wertschritte',
  },
  'settings.valueStepsToggleDesc': {
    en: 'Add a "What value step is this work related to?" picker to flow work blocks.',
    da: 'Tilføj en "Hvilket værditrin er dette arbejde knyttet til?"-vælger til flow-arbejdsblokke.',
    sv: 'Lägg till en "Vilket värdesteg hör det här arbetet till?"-väljare på flödesarbetsblock.',
    de: 'Fügt Flow-Arbeitsblöcken eine Auswahl "Auf welchen Wertschritt bezieht sich diese Arbeit?" hinzu.',
  },
  // Phase 4B (2026-04-16) — synthesis helper
  'settings.synthesiseWorkSteps': {
    en: 'Synthesise work blocks from free-text',
    da: 'Syntetiser arbejdsblokke fra fritekst',
    sv: 'Syntetisera arbetsblock från fritext',
    de: 'Arbeitsblöcke aus Freitext synthetisieren',
  },
  'settings.synthesiseDesc': {
    en: 'Group existing free-text Flow blocks into reusable work-block types.',
    da: 'Grupper eksisterende fritekst-forløbsblokke i genanvendelige arbejdsblokke.',
    sv: 'Gruppera befintliga fritext-flödesblock till återanvändbara arbetsblockstyper.',
    de: 'Bestehende Freitext-Ablaufblöcke in wiederverwendbare Arbeitsblöcke gruppieren.',
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
    en: 'Blocks of work',
    da: 'Arbejdsblokke',
    sv: 'Arbetsblock',
    de: 'Arbeitsblöcke',
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
  'settings.addDecision': {
    en: 'Add decision point',
    da: 'Tilføj beslutningspunkt',
    sv: 'Lägg till beslutspunkt',
    de: 'Entscheidungspunkt hinzufügen',
  },
  'settings.moveDecision': {
    en: 'Move',
    da: 'Flyt',
    sv: 'Flytta',
    de: 'Verschieben',
  },
  'settings.milestoneOutcomeLabel': {
    en: 'Outcome',
    da: 'Udfald',
    sv: 'Utfall',
    de: 'Ergebnis',
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
  // Decision-box redesign (0042): milestone subquestions editor.
  'settings.subquestions': {
    en: 'Subquestion',
    da: 'Underspørgsmål',
    sv: 'Underfråga',
    de: 'Unterfrage',
  },
  'settings.subquestionsDesc': {
    en: 'Ordered milestones a case moves through. Each holds the subquestions to fill in — a milestone completes once every required one is answered, and the last answer sets its date. The final milestone completing closes the case.',
    da: 'Rækkefølgen af milepæle, en sag bevæger sig igennem. Hver rummer de underspørgsmål, der skal udfyldes — en milepæl fuldføres, når alle påkrævede er besvaret, og det sidste svar sætter dens dato. Når den sidste milepæl fuldføres, lukkes sagen.',
    sv: 'Ordnade milstolpar ett ärende rör sig genom. Varje rymmer de underfrågor som ska fyllas i — en milstolpe slutförs när alla obligatoriska besvarats, och det sista svaret sätter dess datum. När den sista milstolpen slutförs stängs ärendet.',
    de: 'Geordnete Meilensteine, die ein Fall durchläuft. Jeder enthält die auszufüllenden Unterfragen — ein Meilenstein ist abgeschlossen, sobald alle erforderlichen beantwortet sind, und die letzte Antwort setzt sein Datum. Wenn der letzte Meilenstein abgeschlossen wird, wird der Fall geschlossen.',
  },
  'settings.addSubquestion': {
    en: 'Add subquestion',
    da: 'Tilføj underspørgsmål',
    sv: 'Lägg till underfråga',
    de: 'Unterfrage hinzufügen',
  },
  'settings.addPreset': {
    en: 'Add preset',
    da: 'Tilføj forudindstilling',
    sv: 'Lägg till förval',
    de: 'Vorlage hinzufügen',
  },
  'settings.subquestionRequired': {
    en: 'Required',
    da: 'Påkrævet',
    sv: 'Obligatorisk',
    de: 'Erforderlich',
  },
  'settings.subquestionNotMandatory': {
    en: 'Not mandatory',
    da: 'Ikke obligatorisk',
    sv: 'Inte obligatorisk',
    de: 'Nicht obligatorisch',
  },
  'settings.subquestionNotMandatoryAll': {
    en: 'Not mandatory (all cases)',
    da: 'Ikke obligatorisk (alle sager)',
    sv: 'Inte obligatorisk (alla ärenden)',
    de: 'Nicht obligatorisch (alle Fälle)',
  },
  'settings.subquestionNotMandatoryHint': {
    en: 'milestone can complete without it',
    da: 'milepælen kan fuldføres uden den',
    sv: 'milstolpen kan slutföras utan den',
    de: 'Meilenstein kann ohne sie abgeschlossen werden',
  },
  'settings.subquestionNotMandatoryFor': {
    en: 'Not mandatory for',
    da: 'Ikke obligatorisk for',
    sv: 'Inte obligatorisk för',
    de: 'Nicht obligatorisch für',
  },
  'settings.subquestionExcludeFor': {
    en: 'Exclude for',
    da: 'Udelad for',
    sv: 'Uteslut för',
    de: 'Ausschließen für',
  },
  'settings.subquestionScopeHeading': {
    en: 'When this question applies',
    da: 'Hvornår dette spørgsmål gælder',
    sv: 'När denna fråga gäller',
    de: 'Wann diese Frage gilt',
  },
  'settings.demandTypePickerEmpty': {
    en: 'all cases',
    da: 'alle sager',
    sv: 'alla ärenden',
    de: 'alle Fälle',
  },
  'settings.subquestionFieldType': {
    en: 'Field type',
    da: 'Felttype',
    sv: 'Fälttyp',
    de: 'Feldtyp',
  },
  'settings.subquestionKindNumber': {
    en: 'Number',
    da: 'Tal',
    sv: 'Tal',
    de: 'Zahl',
  },
  'settings.subquestionKindText': {
    en: 'Text',
    da: 'Tekst',
    sv: 'Text',
    de: 'Text',
  },
  // Multi-select answer type (0062). da/sv/de drafted — pending Jonas's approval.
  'settings.subquestionKindMultichoice': {
    en: 'Multi-select',
    da: 'Multivalg',
    sv: 'Flerval',
    de: 'Mehrfachauswahl',
  },
  'settings.subquestionKindPercent': {
    en: 'Percent',
    da: 'Procent',
    sv: 'Procent',
    de: 'Prozent',
  },
  'settings.subquestionKindCurrency': {
    en: 'Currency',
    da: 'Valuta',
    sv: 'Valuta',
    de: 'Währung',
  },
  'settings.subquestionKindDurationMonths': {
    en: 'Years & months → months',
    da: 'År & måneder → måneder',
    sv: 'År & månader → månader',
    de: 'Jahre & Monate → Monate',
  },
  'settings.milestoneFieldCount': {
    en: '{count} fields',
    da: '{count} felter',
    sv: '{count} fält',
    de: '{count} Felder',
  },
  'settings.subquestionCurrencyCode': {
    en: 'Currency',
    da: 'Valuta',
    sv: 'Valuta',
    de: 'Währung',
  },
  'settings.subquestionKindCalculated': {
    en: 'Calculated',
    da: 'Beregnet',
    sv: 'Beräknad',
    de: 'Berechnet',
  },
  'settings.subquestionFormula': {
    en: 'Formula',
    da: 'Formel',
    sv: 'Formel',
    de: 'Formel',
  },
  'settings.subquestionFormulaHelp': {
    en: 'Use + − × ÷ and the buttons to insert fields — including fields from other milestones. MONTHS() turns a duration into months; MONTHS_BETWEEN() counts months between two dates.',
    da: 'Brug + − × ÷ og knapperne til at indsætte felter — også felter fra andre milepæle. MONTHS() laver en varighed om til måneder; MONTHS_BETWEEN() tæller måneder mellem to datoer.',
    sv: 'Använd + − × ÷ och knapparna för att infoga fält — även fält från andra milstolpar. MONTHS() gör en varaktighet till månader; MONTHS_BETWEEN() räknar månader mellan två datum.',
    de: 'Nutze + − × ÷ und die Schaltflächen, um Felder einzufügen — auch Felder aus anderen Meilensteinen. MONTHS() wandelt eine Dauer in Monate um; MONTHS_BETWEEN() zählt Monate zwischen zwei Daten.',
  },
  'settings.subquestionFormulaInvalid': {
    en: 'Check the formula',
    da: 'Tjek formlen',
    sv: 'Kontrollera formeln',
    de: 'Formel prüfen',
  },
  'settings.subquestionFormulaNoFields': {
    en: 'Add other fields first, then reference them here — from this or any milestone.',
    da: 'Tilføj andre felter først, og henvis til dem her — fra denne eller en anden milepæl.',
    sv: 'Lägg till andra fält först och hänvisa till dem här — från denna eller någon annan milstolpe.',
    de: 'Füge zuerst andere Felder hinzu und verweise dann hier darauf — aus diesem oder einem anderen Meilenstein.',
  },
  'settings.subquestionFormulaPreview': {
    en: 'This calculates:',
    da: 'Dette beregner:',
    sv: 'Detta beräknar:',
    de: 'Das berechnet:',
  },
  'settings.subquestionFormulaPreviewEmpty': {
    en: 'Pick fields and operators to build the calculation.',
    da: 'Vælg felter og regnetegn for at bygge beregningen.',
    sv: 'Välj fält och räknetecken för att bygga beräkningen.',
    de: 'Wähle Felder und Rechenzeichen, um die Berechnung aufzubauen.',
  },
  'settings.subquestionFormulaFieldFallback': {
    en: 'field',
    da: 'felt',
    sv: 'fält',
    de: 'Feld',
  },
  'settings.formulaMonthsOf': {
    en: 'months of',
    da: 'måneder af',
    sv: 'månader av',
    de: 'Monate von',
  },
  'settings.formulaMonthsBetween': {
    en: 'months between',
    da: 'måneder mellem',
    sv: 'månader mellan',
    de: 'Monate zwischen',
  },
  'settings.formulaBetweenAnd': {
    en: 'and',
    da: 'og',
    sv: 'och',
    de: 'und',
  },
  'settings.subquestionResultFormat': {
    en: 'Show result as',
    da: 'Vis resultat som',
    sv: 'Visa resultat som',
    de: 'Ergebnis anzeigen als',
  },
  'settings.resultFormatNumber': {
    en: 'Number',
    da: 'Tal',
    sv: 'Tal',
    de: 'Zahl',
  },
  'settings.resultFormatPercent': {
    en: 'Percentage',
    da: 'Procent',
    sv: 'Procent',
    de: 'Prozent',
  },
  'settings.subquestionCondition': {
    en: 'Show only when',
    da: 'Vis kun når',
    sv: 'Visa endast när',
    de: 'Nur anzeigen wenn',
  },
  'settings.subquestionConditionNone': {
    en: 'Always shown',
    da: 'Vises altid',
    sv: 'Visas alltid',
    de: 'Immer angezeigt',
  },
  'settings.subquestionConditionEquals': {
    en: 'is',
    da: 'er',
    sv: 'är',
    de: 'ist',
  },
  'settings.subquestionConditionParentPlaceholder': {
    en: 'Choose a question…',
    da: 'Vælg et spørgsmål…',
    sv: 'Välj en fråga…',
    de: 'Frage wählen…',
  },
  'settings.subquestionConditionValuePlaceholder': {
    en: 'Choose an answer…',
    da: 'Vælg et svar…',
    sv: 'Välj ett svar…',
    de: 'Antwort wählen…',
  },
  'settings.subquestionConditionNoChoices': {
    en: 'Add a Yes/No or choice question to this study first, then branch off it.',
    da: 'Tilføj et ja/nej- eller valgspørgsmål til studiet først, og forgren derfra.',
    sv: 'Lägg till en ja/nej- eller valfråga i studien först och förgrena därifrån.',
    de: 'Füge der Studie zuerst eine Ja/Nein- oder Auswahlfrage hinzu und verzweige davon.',
  },
  'settings.milestoneAppliesTo': {
    en: 'Applies to',
    da: 'Gælder for',
    sv: 'Gäller för',
    de: 'Gilt für',
  },
  'settings.milestoneAppliesToAll': {
    en: 'all cases',
    da: 'alle sager',
    sv: 'alla ärenden',
    de: 'alle Fälle',
  },
  // Decision-box builder UX (2026-07-04): build branching downward from the
  // parent answer instead of wiring children upward via "Show only when".
  'settings.ifValueAsk': {
    en: 'Add follow-up if "{value}"',
    da: 'Tilføj opfølgning hvis "{value}"',
    sv: 'Lägg till uppföljning om "{value}"',
    de: 'Folgefrage hinzufügen wenn „{value}"',
  },
  'settings.followUpHint': {
    en: 'Tip: use "Add follow-up" under an answer to ask a further question only when that answer is chosen.',
    da: 'Tip: brug "Tilføj opfølgning" under et svar for at stille et yderligere spørgsmål kun når det svar vælges.',
    sv: 'Tips: använd "Lägg till uppföljning" under ett svar för att ställa en följdfråga bara när det svaret väljs.',
    de: 'Tipp: Nutzen Sie „Folgefrage hinzufügen" unter einer Antwort, um nur bei dieser Antwort eine weitere Frage zu stellen.',
  },
  'settings.ifValueHeader': {
    en: 'If "{value}":',
    da: 'Hvis "{value}":',
    sv: 'Om "{value}":',
    de: 'Wenn „{value}":',
  },
  'settings.childQuestionLabelPlaceholder': {
    en: 'Follow-up question…',
    da: 'Opfølgende spørgsmål…',
    sv: 'Följdfråga…',
    de: 'Folgefrage…',
  },
  'settings.addYesNoQuestion': {
    en: 'Yes/No question',
    da: 'Ja/nej-spørgsmål',
    sv: 'Ja/nej-fråga',
    de: 'Ja/Nein-Frage',
  },
  'settings.optionOnTrack': {
    en: 'On track',
    da: 'På sporet',
    sv: 'På rätt spår',
    de: 'Auf Kurs',
  },
  'settings.optionNeutral': {
    en: 'Neutral',
    da: 'Neutral',
    sv: 'Neutral',
    de: 'Neutral',
  },
  'settings.optionNegative': {
    en: 'Negative',
    da: 'Negativ',
    sv: 'Negativ',
    de: 'Negativ',
  },
  'settings.optionSuggestClose': {
    en: 'Suggest closing case',
    da: 'Foreslå at lukke sagen',
    sv: 'Föreslå att stänga ärendet',
    de: 'Fallabschluss vorschlagen',
  },
  'settings.optionSuggestCloseHint': {
    en: 'Picking this answer offers to close the case',
    da: 'Vælges dette svar, tilbydes det at lukke sagen',
    sv: 'Väljs det här svaret erbjuds att stänga ärendet',
    de: 'Bei dieser Antwort wird angeboten, den Fall zu schließen',
  },
  'settings.shownWhenNote': {
    en: 'Shown when {parent} = {value}',
    da: 'Vises når {parent} = {value}',
    sv: 'Visas när {parent} = {value}',
    de: 'Angezeigt wenn {parent} = {value}',
  },
  'settings.staleTriggerNote': {
    en: 'Points at a removed answer option — re-wire or remove the rule below',
    da: 'Peger på en fjernet svarmulighed — omkobl eller fjern reglen nedenfor',
    sv: 'Pekar på ett borttaget svarsalternativ — koppla om eller ta bort regeln nedan',
    de: 'Verweist auf eine entfernte Antwortoption — unten neu verknüpfen oder Regel entfernen',
  },
  'settings.advancedToggle': {
    en: 'Advanced',
    da: 'Avanceret',
    sv: 'Avancerat',
    de: 'Erweitert',
  },
  // Plain-language answer meaning (2026-07-04). Data model unchanged: maps to
  // the option polarity column (positive/null/negative).
  'settings.optionPolarity': {
    en: 'What this answer means',
    da: 'Hvad dette svar betyder',
    sv: 'Vad det här svaret betyder',
    de: 'Was diese Antwort bedeutet',
  },
  'settings.addOption': {
    en: 'Add option',
    da: 'Tilføj valgmulighed',
    sv: 'Lägg till alternativ',
    de: 'Option hinzufügen',
  },
  'settings.finalMilestoneHint': {
    en: 'Final milestone — completing it closes the case',
    da: 'Sidste milepæl — når den fuldføres, lukkes sagen',
    sv: 'Sista milstolpen — när den slutförs stängs ärendet',
    de: 'Letzter Meilenstein — sein Abschluss schließt den Fall',
  },
  'settings.wmEvaluateHint': {
    en: 'To evaluate delivery, link a milestone subquestion to this in the Milestones section.',
    da: 'For at vurdere leveringen skal du linke et milepæls-underspørgsmål til denne i Milepæle-afsnittet.',
    sv: 'För att utvärdera leveransen, länka en milstolpe-underfråga till denna i Milstolpar-avsnittet.',
    de: 'Um die Lieferung zu bewerten, verknüpfe im Abschnitt Meilensteine eine Unterfrage mit dieser Angabe.',
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
  // Decision-box redesign (0042).
  'capture.milestoneCompletedOnLabel': {
    en: 'Completed',
    da: 'Fuldført',
    sv: 'Slutförd',
    de: 'Abgeschlossen am',
  },
  'capture.milestoneNoSubquestions': {
    en: 'No fields to fill in yet',
    da: 'Ingen felter at udfylde endnu',
    sv: 'Inga fält att fylla i ännu',
    de: 'Noch keine Felder auszufüllen',
  },
  'capture.closePromptTitle': {
    en: 'This looks like a negative outcome — close this case?',
    da: 'Det ligner et negativt udfald — luk denne sag?',
    sv: 'Det här ser ut som ett negativt utfall — stäng det här ärendet?',
    de: 'Das sieht nach einem negativen Ergebnis aus — diesen Fall schließen?',
  },
  'capture.closePromptConfirm': {
    en: 'Close case',
    da: 'Luk sag',
    sv: 'Stäng ärende',
    de: 'Fall schließen',
  },
  'capture.closePromptCancel': {
    en: 'Keep open',
    da: 'Hold åben',
    sv: 'Håll öppet',
    de: 'Offen lassen',
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
    en: 'Work in this touch',
    da: 'Arbejde i denne berøring',
    sv: 'Arbete i denna kontakt',
    de: 'Arbeit in diesem Kontakt',
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
    en: 'Failure-demand type per work block',
    da: 'Type af ikke-værdiskabende efterspørgsel pr. arbejdsblok',
    sv: 'Typ av icke-värdeskapande efterfrågan per arbetsblock',
    de: 'Fehler-Nachfrage-Typ je Arbeitsblock',
  },
  'capture.toggles.valueCreationCapability': {
    en: 'Value creation capability per work entry',
    da: 'Evne til værdiskabelse pr. arbejdsindtastning',
    sv: 'Värdeskapandekapabilitet per arbetspost',
    de: 'Wertschöpfungsfähigkeit je Arbeitseintrag',
  },
  'capture.toggles.brokerChannel': {
    en: 'Broker / Direct channel (customer box)',
    da: 'Mægler/Direkte-kanal (kundeboks)',
    sv: 'Mäklare/Direkt-kanal (kundruta)',
    de: 'Makler/Direkt-Kanal (Kundenbox)',
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
  // Decision-box Yes/No answer options (2026-07-04): created in the author's UI
  // language, rendered localized in every UI language.
  ['Yes', 'Ja', 'Ja', 'Ja'],
  ['No', 'Nej', 'Nej', 'Nein'],
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
