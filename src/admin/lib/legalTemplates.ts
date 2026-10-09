// Gliederungsvorlagen für Impressum und Datenschutz. Sie enthalten nur Angaben, die sich aus dem
// Aufbau der Website ergeben, und eckige Klammern dort, wo der Betreiber etwas ergänzen muss.
// Sie ersetzen keine Rechtsberatung: Vor der Veröffentlichung prüfen lassen.
import type { LegalKind } from '../../lib/legalDoc'

const IMPRINT = `<h2>Angaben gemäß § 5 DDG</h2>
<p>Stephan Graf Bentzel-Sturmfeder<br>Schloss Jägersburg, Fürstenweg 1<br>91330 Bammersdorf</p>
<h2>Kontakt</h2>
<p>Telefon: +49 177 4346401<br>E-Mail: stephan.bentzel@viqua.de</p>
<h2>Umsatzsteuer</h2>
<p>Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG: [bitte ergänzen, falls vorhanden]</p>
<h2>Verantwortlich für den Inhalt</h2>
<p>Stephan Graf Bentzel-Sturmfeder, Anschrift wie oben.</p>
<h2>Urheberrecht</h2>
<p>Alle Werke, Bilder und Texte dieser Website sind urheberrechtlich geschützt. Eine Verwendung ohne schriftliche Zustimmung ist nicht gestattet.</p>`

const PRIVACY = `<h2>1. Verantwortlicher</h2>
<p>Stephan Graf Bentzel-Sturmfeder, Schloss Jägersburg, Fürstenweg 1, 91330 Bammersdorf, E-Mail: stephan.bentzel@viqua.de.</p>
<h2>2. Grundsatz</h2>
<p>Diese Website verwendet keine Cookies, keine Analyse- oder Werbewerkzeuge und keine externen Schriften. Die Schriften werden von der Website selbst ausgeliefert.</p>
<h2>3. Hosting und Datenbank</h2>
<p>Inhalte und Anfragen werden bei Supabase (Rechenzentrum in Frankfurt am Main, EU) gespeichert. Beim Aufruf der Website verarbeitet der Hosting-Anbieter technisch notwendige Verbindungsdaten (zum Beispiel die IP-Adresse) in Server-Protokollen. Hosting-Anbieter: [bitte ergänzen].</p>
<h2>4. Anfragen und Kontaktformulare</h2>
<p>Wenn Sie ein Formular absenden (Werkanfrage, Seminar, Vortrag, Kunstkurs, Kontakt, Veranstaltung), speichern wir Ihre Angaben (Name, E-Mail-Adresse und Ihre Nachricht sowie freiwillige Angaben wie Telefon oder Unternehmen), um Ihre Anfrage zu beantworten. Rechtsgrundlage ist Ihre Einwilligung beziehungsweise die Anbahnung eines Vertrags (Art. 6 Abs. 1 lit. a und b DSGVO). Die Daten werden gelöscht, sobald sie dafür nicht mehr erforderlich sind, spätestens nach [bitte Frist ergänzen].</p>
<p>Zum Schutz vor Missbrauch speichern wir einen Hash Ihrer Verbindungsdaten für kurze Zeit, um die Zahl der Anfragen zu begrenzen. Daraus lässt sich keine Adresse zurückrechnen.</p>
<h2>5. Anmeldung zu Veranstaltungen</h2>
<p>Bei einer Anmeldung speichern wir Name, E-Mail-Adresse, optional Telefon und die Zahl der Begleitpersonen. Sie erhalten eine Bestätigung per E-Mail mit einem persönlichen Link, über den Sie sich wieder abmelden können.</p>
<h2>6. E-Mail-Versand</h2>
<p>Bestätigungen und Benachrichtigungen versenden wir über den Dienstleister Resend. Dabei werden Ihre E-Mail-Adresse und der Inhalt der Nachricht an den Dienstleister übermittelt. Angaben zum Standort der Verarbeitung und zu den Garantien nach Art. 46 DSGVO: [bitte ergänzen].</p>
<h2>7. Anonyme Nutzungszahlen</h2>
<p>Wir zählen anonym, wie oft Werke und Veranstaltungen angesehen und angeklickt werden. Es werden nur Zähler je Objekt und Tag gespeichert, keine Kennungen, keine IP-Adressen und keine Profile. Damit ein Besuch nur einmal zählt, merkt sich Ihr Browser dies bis zum Schließen des Tabs im Speicher der Sitzung (sessionStorage).</p>
<h2>8. Ihre Rechte</h2>
<p>Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch sowie das Recht, eine erteilte Einwilligung jederzeit zu widerrufen. Außerdem können Sie sich bei einer Datenschutz-Aufsichtsbehörde beschweren. Zuständig ist das Bayerische Landesamt für Datenschutzaufsicht.</p>`

export const LEGAL_TEMPLATES: Record<LegalKind, string> = {
  imprint: IMPRINT,
  privacy: PRIVACY,
}
