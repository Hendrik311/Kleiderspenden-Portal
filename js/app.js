// Vue.js wird per CDN als globales Objekt "Vue" geladen (siehe index.html).
// Daraus wird die Funktion createApp entnommen, mit der eine Vue-Anwendung erzeugt wird.
const { createApp } = Vue;

// Seiten, die über die Adresse (#/start, #/spende, ...) aufgerufen werden können
const SEITEN = ['start', 'spende', 'impressum', 'datenschutz'];

// Liest die aktuelle Seite aus der Adresse; unbekannte Werte führen zur Startseite
function seiteAusAdresse() {
  const seite = window.location.hash.replace('#/', '');
  return SEITEN.includes(seite) ? seite : 'start';
}

// Anfangswerte des Formulars. Sie werden an zwei Stellen gebraucht: in data() beim Start
// und beim Zurücksetzen über "Neue Spende registrieren". So stehen sie nur einmal im Code.
// Als Funktion, damit jedes Mal ein neues Objekt mit neuen, leeren Listen entsteht.
function leeresFormular() {
  return {
    uebergabeart: '',     // 'geschaeftsstelle' oder 'abholung'
    name: '',             // Vor- und Nachname, immer Pflicht
    kleidungstypen: [],   // Liste, weil mehrere Typen angehakt werden können
    zielgruppen: [],      // Liste, weil mehrere Zielgruppen angehakt werden können
    krisengebiet: '',
    strasse: '',          // Felder ab hier nur für die Abholung
    plz: '',
    ort: '',
    volumen: '',
    wunschdatum: '',
    zeitfenster: ''
  };
}

// Wandelt ein Datum in Text im Format JJJJ-MM-TT um (lokale Zeit), z. B. "2026-10-13".
// Dieses Format verwendet auch das Datumsfeld im Formular.
// padStart(2, '0') macht aus "7" eine "07".
function datumAlsText(datum) {
  const jahr = datum.getFullYear();
  const monat = String(datum.getMonth() + 1).padStart(2, '0');   // getMonth() zählt ab 0
  const tag = String(datum.getDate()).padStart(2, '0');
  return `${jahr}-${monat}-${tag}`;
}

// Wandelt "2026-10-13" in die deutsche Schreibweise "13.10.2026" um:
// an den Bindestrichen trennen, Reihenfolge umdrehen und mit Punkten verbinden
function deutschesDatum(text) {
  return text.split('-').reverse().join('.');
}

// createApp erzeugt die Vue-Anwendung. Das übergebene Objekt beschreibt,
// welche Daten die Anwendung hat und was beim Start passieren soll.
createApp({
  // data() liefert die reaktiven Daten der Anwendung. Ändert sich ein Wert,
  // aktualisiert Vue automatisch alle Stellen im HTML, die ihn verwenden
  // (z. B. {{ jahr }}, v-if="seite === 'start'" oder v-for="eintrag in navigation").
  data() {
    return {
      seite: seiteAusAdresse(),           // aktuell angezeigte Seite
      jahr: new Date().getFullYear(),     // aktuelles Jahr für das Copyright im Footer
      navigation: [                       // Einträge der Navigationsleiste
        { seite: 'start', titel: 'Start' },
        { seite: 'spende', titel: 'Spende registrieren' }
      ],

      // Eingaben aus dem Registrierungsformular. Jedes Feld ist über v-model
      // mit einem Eingabefeld in index.html verbunden. Anfangswerte siehe leeresFormular().
      formular: leeresFormular(),

      // Geschäftsstelle für die Übergabe vor Ort (gleiche Adresse wie im Impressum)
      geschaeftsstelle: {
        name: 'Kleiderspenden-Verein',
        strasse: 'Musterstraße 1',
        plz: '99084',
        ort: 'Erfurt'
      },

      // Auswahlmöglichkeiten für die Listen im Formular
      optionen: {
        kleidungstypen: ['Jacken', 'Hoodie/Sweatshirtjacke', 'T-Shirt', 'Hosen', 'Unterwäsche', 'Socken'],
        zielgruppen: ['Herren', 'Damen', 'Kinder'],
        krisengebiete: ['Ukraine', 'Gaza-Streifen', 'Sudan', 'Myanmar'],
        zeitfenster: ['08–12 Uhr', '12–16 Uhr', '16–19 Uhr']
      },

      // Fehlermeldungen der Prüfung: Schlüssel = Feldname, Wert = Meldung
      // (z. B. { plz: 'Bitte geben Sie die Postleitzahl an.' }). Leer = keine Fehler.
      fehler: {},

      // true, sobald die Spende erfolgreich registriert wurde: Dann wird statt
      // des Formulars die Bestätigungsseite angezeigt
      bestaetigt: false,

      // Zeitpunkt der Registrierung (wird beim Absenden automatisch gesetzt), vorher null
      zeitpunkt: null,

      // Registriernummer im Format KS-JJJJMMTT-NNNN (wird beim Absenden erzeugt), vorher leer
      registriernummer: ''
    };
  },

  // computed enthält berechnete Werte. Vue rechnet sie automatisch neu aus,
  // sobald sich die Daten ändern, auf denen sie beruhen.
  computed: {
    // --- Kleidungsstück-Typ ---

    // Checkbox "Alle auswählen" beim Kleidungsstück-Typ
    alleTypenGewaehlt: {
      // get: angehakt, wenn alle Typen gewählt sind
      get() {
        return this.formular.kleidungstypen.length === this.optionen.kleidungstypen.length;
      },
      // set: wird aufgerufen, wenn man die Checkbox anklickt.
      // Angehakt = Kopie der kompletten Liste übernehmen, abgehakt = Liste leeren.
      set(angehakt) {
        this.formular.kleidungstypen = angehakt ? [...this.optionen.kleidungstypen] : [];
      }
    },

    // Text auf dem Button der Kleidungsstück-Auswahl
    kleidungstypenAnzeige() {
      if (this.formular.kleidungstypen.length === 0) {
        return 'Bitte wählen';
      }
      if (this.alleTypenGewaehlt) {
        return 'Alle Typen';
      }
      return this.formular.kleidungstypen.join(', ');   // z. B. "Jacken, Socken"
    },

    // --- Zielgruppe (gleicher Aufbau wie beim Kleidungsstück-Typ) ---

    // Checkbox "Alle auswählen" bei der Zielgruppe
    alleZielgruppenGewaehlt: {
      get() {
        return this.formular.zielgruppen.length === this.optionen.zielgruppen.length;
      },
      set(angehakt) {
        this.formular.zielgruppen = angehakt ? [...this.optionen.zielgruppen] : [];
      }
    },

    // Text auf dem Button der Zielgruppen-Auswahl
    zielgruppenAnzeige() {
      if (this.formular.zielgruppen.length === 0) {
        return 'Bitte wählen';
      }
      if (this.alleZielgruppenGewaehlt) {
        return 'Alle Zielgruppen';
      }
      return this.formular.zielgruppen.join(', ');
    },

    // --- Wunschdatum ---

    // Frühestes mögliches Abholdatum: heute plus 3 Arbeitstage (Montag bis Freitag,
    // lokale Zeit) als Text im Format JJJJ-MM-TT, z. B. "2026-10-14".
    // Dieses Format verwendet auch das Datumsfeld, deshalb lassen sich beide direkt vergleichen.
    // Das Wochenende wird übersprungen: Es wird Tag für Tag weitergezählt, aber nur
    // Montag bis Freitag zählen als Arbeitstag. Beispiel: Freitag → frühestens Mittwoch.
    // Feiertage werden bewusst nicht berücksichtigt.
    // setDate() rechnet Monats- und Jahreswechsel automatisch richtig (z. B. 31.12. + 1 Tag).
    fruehestesDatum() {
      const datum = new Date();
      let arbeitstage = 0;
      while (arbeitstage < 3) {
        datum.setDate(datum.getDate() + 1);   // einen Tag weiter
        const wochentag = datum.getDay();     // 0 = Sonntag, 1 = Montag, ..., 6 = Samstag
        if (wochentag !== 0 && wochentag !== 6) {
          arbeitstage++;                      // nur Montag bis Freitag mitzählen
        }
      }
      return datumAlsText(datum);
    },

    // --- Bestätigungsseite ---

    // Gewählte Kleidungstypen einzeln und kommagetrennt, in der Reihenfolge der Auswahlliste
    // (auf der Bestätigungsseite nie als "Alle Typen" zusammengefasst)
    kleidungstypenListe() {
      return this.optionen.kleidungstypen
        .filter(typ => this.formular.kleidungstypen.includes(typ))
        .join(', ');
    },

    // Gewählte Zielgruppen einzeln und kommagetrennt, in der Reihenfolge der Auswahlliste
    zielgruppenListe() {
      return this.optionen.zielgruppen
        .filter(gruppe => this.formular.zielgruppen.includes(gruppe))
        .join(', ');
    },

    // Zeitpunkt der Registrierung auf Deutsch, z. B. "09.10.2026, 22:15 Uhr".
    // '2-digit' sorgt für zweistellige Angaben (z. B. 09 statt 9).
    registriertAm() {
      if (this.zeitpunkt === null) {
        return '';
      }
      const datum = this.zeitpunkt.toLocaleDateString('de-DE',
        { day: '2-digit', month: '2-digit', year: 'numeric' });
      const uhrzeit = this.zeitpunkt.toLocaleTimeString('de-DE',
        { hour: '2-digit', minute: '2-digit' });
      return `${datum}, ${uhrzeit} Uhr`;
    },

    // Abholtermin für die Bestätigungsseite.
    // Hat die Person Datum UND Zeitfenster gewählt, ist das ihr Wunschtermin,
    // z. B. "20.10.2026, 12–16 Uhr (Ihr Wunschtermin)".
    // Fehlt etwas, ergänzen wir: Datum = frühestes Datum, Zeitfenster = erstes aus der Liste,
    // z. B. "13.10.2026, 08–12 Uhr (von uns vorgegeben)".
    termin() {
      const f = this.formular;
      if (f.wunschdatum !== '' && f.zeitfenster !== '') {
        return `${deutschesDatum(f.wunschdatum)}, ${f.zeitfenster} (Ihr Wunschtermin)`;
      }
      const datum = f.wunschdatum !== '' ? f.wunschdatum : this.fruehestesDatum;
      const zeitfenster = f.zeitfenster !== '' ? f.zeitfenster : this.optionen.zeitfenster[0];
      return `${deutschesDatum(datum)}, ${zeitfenster} (von uns vorgegeben)`;
    }
  },

  // watch beobachtet einzelne Daten. Ändert sich ein beobachteter Wert,
  // ruft Vue automatisch die zugehörige Funktion auf.
  watch: {
    // Wird aufgerufen, sobald eine andere Übergabeart angeklickt wird.
    // neueArt enthält den neu gewählten Wert ('geschaeftsstelle' oder 'abholung').
    'formular.uebergabeart'(neueArt) {
      // Wer erst eine Adresse eintippt und dann doch zur Geschäftsstelle wechselt,
      // soll keine alten Abholdaten im Formular zurücklassen. Sonst könnten sie später
      // versehentlich auf der Bestätigungsseite erscheinen. Deshalb werden alle
      // Abholfelder geleert, sobald nicht mehr "Abholung" gewählt ist.
      if (neueArt !== 'abholung') {
        this.formular.strasse = '';
        this.formular.plz = '';
        this.formular.ort = '';
        this.formular.volumen = '';
        this.formular.wunschdatum = '';
        this.formular.zeitfenster = '';
      }

      // Alte Fehlermeldungen entfernen, damit z. B. keine Fehler der
      // Abholfelder stehen bleiben, die gerade gar nicht angezeigt werden.
      // Damit verschwindet auch die Meldung der Übergabeart selbst.
      this.fehler = {};
    },

    // --- Fehlermeldung eines Feldes verschwindet, sobald es geändert wird ---
    // Ein Watcher pro Feld ist hier am zuverlässigsten: Er bemerkt jede Änderung,
    // egal auf welchem Weg sie passiert (Tippen, Anklicken, Auswahlliste oder
    // "Alle auswählen"). Ein Ereignis wie @input am Feld würde z. B. "Alle auswählen"
    // nicht erfassen, weil dort die Liste über computed geändert wird.
    // deep: true sorgt bei Listen dafür, dass auch das Anhaken oder Abhaken
    // eines einzelnen Eintrags bemerkt wird.
    'formular.kleidungstypen': {
      handler() { this.fehlerLoeschen('kleidungstypen'); },
      deep: true
    },
    'formular.zielgruppen': {
      handler() { this.fehlerLoeschen('zielgruppen'); },
      deep: true
    },
    'formular.name'() { this.fehlerLoeschen('name'); },
    'formular.krisengebiet'() { this.fehlerLoeschen('krisengebiet'); },
    'formular.strasse'() { this.fehlerLoeschen('strasse'); },
    'formular.plz'() { this.fehlerLoeschen('plz'); },
    'formular.ort'() { this.fehlerLoeschen('ort'); },
    'formular.volumen'() { this.fehlerLoeschen('volumen'); },
    'formular.wunschdatum'() { this.fehlerLoeschen('wunschdatum'); }
  },

  // methods enthält Funktionen, die z. B. beim Absenden des Formulars aufgerufen werden
  methods: {
    // Prüft alle Eingaben. Füllt this.fehler neu und gibt true zurück,
    // wenn kein Fehler gefunden wurde.
    pruefen() {
      const f = this.formular;
      const fehler = {};

      // Diese Angaben sind immer Pflicht
      if (f.uebergabeart === '') {
        fehler.uebergabeart = 'Bitte wählen Sie eine Übergabeart.';
      }

      // Name: erst leer, dann unzulässige Zeichen (Whitelist, siehe Erklärung unten),
      // dann zu lang. Erlaubt sind Buchstaben, Leerzeichen, Punkt, Apostroph und Bindestrich.
      const name = f.name.trim();
      if (name === '') {
        fehler.name = 'Bitte geben Sie Ihren Namen an.';
      } else if (!/^[\p{L} .'-]+$/u.test(name)) {
        fehler.name = 'Der Name enthält unzulässige Zeichen.';
      } else if (name.length > 60) {
        fehler.name = 'Der Name darf höchstens 60 Zeichen lang sein.';
      }

      if (f.kleidungstypen.length === 0) {
        fehler.kleidungstypen = 'Bitte wählen Sie mindestens einen Kleidungsstück-Typ.';
      }
      if (f.zielgruppen.length === 0) {
        fehler.zielgruppen = 'Bitte wählen Sie mindestens eine Zielgruppe.';
      }
      if (f.krisengebiet === '') {
        fehler.krisengebiet = 'Bitte wählen Sie ein Krisengebiet.';
      }

      // Diese Angaben sind nur bei einer Abholung Pflicht.
      // trim() entfernt Leerzeichen am Anfang und Ende, sodass eine Eingabe
      // aus nur Leerzeichen als leer gilt.
      //
      // Schutz gegen Code-Injektion (z. B. <script>alert(1)</script>):
      // - Eingabeseite: Die Freitextfelder werden mit einer Whitelist geprüft, d. h. es
      //   ist festgelegt, welche Zeichen ERLAUBT sind (statt verbotene aufzuzählen, was man
      //   leicht vergisst). Zeichen wie < > " ; = sind nicht erlaubt, die Eingabe wird abgelehnt.
      //   \p{L} = alle Buchstaben (auch ä, ö, ü, ß), \p{N} = alle Ziffern;
      //   das Flag u am Ende ist nötig, damit \p{...} funktioniert.
      // - Ausgabeseite: Vue maskiert alles, was mit {{ }} angezeigt wird, automatisch.
      //   Dadurch wird ein Text wie <script> nur als Text angezeigt, nie ausgeführt.
      //   Deshalb im Projekt kein v-html, innerHTML oder eval verwenden.
      if (f.uebergabeart === 'abholung') {
        const strasse = f.strasse.trim();
        if (strasse === '') {
          fehler.strasse = 'Bitte geben Sie Straße und Hausnummer an.';
        } else if (!/^[\p{L}\p{N} .,'\/-]+$/u.test(strasse)) {
          fehler.strasse = 'Straße und Hausnummer enthalten unzulässige Zeichen.';
        } else if (strasse.length > 40) {
          fehler.strasse = 'Straße und Hausnummer dürfen höchstens 40 Zeichen lang sein.';
        }

        // PLZ: erst prüfen, ob etwas eingegeben wurde, dann ob es genau
        // fünf Ziffern sind (/^\d{5}$/), dann ob sie mit 99 beginnt
        const plz = f.plz.trim();
        if (plz === '') {
          fehler.plz = 'Bitte geben Sie die Postleitzahl an.';
        } else if (!/^\d{5}$/.test(plz)) {
          fehler.plz = 'Die Postleitzahl muss aus genau fünf Ziffern bestehen.';
        } else if (!plz.startsWith('99')) {
          fehler.plz = 'Die Abholung ist nur im Postleitzahlengebiet 99 möglich.';
        }

        // Ort: nur Buchstaben, Leerzeichen, Punkt, Apostroph, Klammern und Bindestrich
        const ort = f.ort.trim();
        if (ort === '') {
          fehler.ort = 'Bitte geben Sie den Ort an.';
        } else if (!/^[\p{L} .'()-]+$/u.test(ort)) {
          fehler.ort = 'Der Ort enthält unzulässige Zeichen.';
        } else if (ort.length > 30) {
          fehler.ort = 'Der Ort darf höchstens 30 Zeichen lang sein.';
        }

        // Volumen: Buchstaben, Ziffern, Leerzeichen und . , ' / + -
        const volumen = f.volumen.trim();
        if (volumen === '') {
          fehler.volumen = 'Bitte geben Sie das ungefähre Volumen an.';
        } else if (!/^[\p{L}\p{N} .,'\/+-]+$/u.test(volumen)) {
          fehler.volumen = 'Das Volumen enthält unzulässige Zeichen.';
        } else if (volumen.length > 50) {
          fehler.volumen = 'Das Volumen darf höchstens 50 Zeichen lang sein.';
        }

        // Wunschdatum ist freiwillig. Wenn eins gewählt ist, muss es mindestens
        // 3 Arbeitstage (Mo–Fr) in der Zukunft liegen (nicht vor fruehestesDatum).
        // Bei Texten im Format JJJJ-MM-TT entspricht der Textvergleich (<) der Datumsreihenfolge.
        if (f.wunschdatum !== '' && f.wunschdatum < this.fruehestesDatum) {
          fehler.wunschdatum = 'Das Wunschdatum muss mindestens 3 Arbeitstage in der Zukunft liegen.';
        }
        // Zeitfenster ist freiwillig und wird nicht geprüft
      }

      this.fehler = fehler;
      return Object.keys(fehler).length === 0;   // keine Einträge = alles gültig
    },

    // Wird beim Klick auf "Spende registrieren" aufgerufen.
    // Sind alle Eingaben gültig, wird der Zeitpunkt gemerkt und die Bestätigungsseite angezeigt.
    // Sonst bleibt das Formular mit den Fehlermeldungen stehen.
    absenden() {
      if (this.pruefen()) {
        this.zeitpunkt = new Date();   // aktuelles Datum und Uhrzeit

        // Registriernummer KS-JJJJMMTT-NNNN: Datum der Registrierung ohne Bindestriche
        // und eine Zufallszahl von 1000 bis 9999.
        // Ohne Server kann nicht garantiert werden, dass jede Nummer nur einmal vorkommt;
        // im Echtbetrieb würde der Server die Nummern fortlaufend vergeben.
        const datum = datumAlsText(this.zeitpunkt).replaceAll('-', '');   // z. B. "20261010"
        const zufall = Math.floor(Math.random() * 9000) + 1000;            // 1000 bis 9999
        this.registriernummer = `KS-${datum}-${zufall}`;

        this.bestaetigt = true;
        window.scrollTo(0, 0);         // nach oben scrollen, damit die Bestätigung sichtbar ist
      }
    },

    // Wird beim Klick auf "Neue Spende registrieren" aufgerufen:
    // setzt alles auf den Anfang zurück und zeigt wieder das leere Formular
    neueSpende() {
      this.formular = leeresFormular();
      this.fehler = {};
      this.bestaetigt = false;
      this.zeitpunkt = null;
      this.registriernummer = '';
      window.scrollTo(0, 0);
    },

    // Entfernt die Fehlermeldung eines einzelnen Feldes (z. B. 'plz').
    // Die Meldungen der anderen Felder bleiben stehen.
    fehlerLoeschen(feld) {
      delete this.fehler[feld];
    }
  },

  // mounted() wird einmal aufgerufen, sobald Vue die Seite dargestellt hat
  mounted() {
    // Bei jedem Klick auf einen Link wie #/impressum ändert sich die Adresse;
    // dann wird die passende Seite angezeigt und nach oben gescrollt
    window.addEventListener('hashchange', () => {
      this.seite = seiteAusAdresse();
      window.scrollTo(0, 0);

      // Aufgeklapptes Menü auf kleinen Bildschirmen nach der Auswahl wieder schließen
      const menue = document.getElementById('hauptnavigation');
      if (menue.classList.contains('show')) {
        bootstrap.Collapse.getOrCreateInstance(menue).hide();
      }
    });
  }

// mount('#app') verbindet die Anwendung mit dem Element <div id="app"> in index.html.
// Erst ab hier übernimmt Vue diesen Bereich und ersetzt z. B. {{ jahr }} durch den echten Wert.
}).mount('#app');
