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
      // mit einem Eingabefeld in index.html verbunden.
      formular: {
        uebergabeart: '',     // 'geschaeftsstelle' oder 'abholung'
        kleidungstypen: [],   // Liste, weil mehrere Typen angehakt werden können
        zielgruppen: [],      // Liste, weil mehrere Zielgruppen angehakt werden können
        krisengebiet: '',
        strasse: '',          // Felder ab hier nur für die Abholung
        plz: '',
        ort: '',
        volumen: '',
        wunschdatum: '',
        zeitfenster: ''
      },

      // Auswahlmöglichkeiten für die Listen im Formular
      optionen: {
        kleidungstypen: ['Jacken', 'Hoodie oder Sweatshirtjacke', 'T-Shirt', 'Hosen', 'Unterwäsche', 'Socken'],
        zielgruppen: ['Herren', 'Damen', 'Kinder'],
        krisengebiete: ['Ukraine', 'Gaza-Streifen', 'Sudan', 'Myanmar'],
        zeitfenster: ['08–12 Uhr', '12–16 Uhr', '16–19 Uhr']
      },

      // Fehlermeldungen der Prüfung: Schlüssel = Feldname, Wert = Meldung
      // (z. B. { plz: 'Bitte geben Sie die Postleitzahl an.' }). Leer = keine Fehler.
      fehler: {},

      // vorläufig, wird in Schritt 6 ersetzt
      // true, wenn die letzte Prüfung ohne Fehler war (zeigt die grüne Meldung)
      eingabeGueltig: false
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

    // Heutiges Datum (lokale Zeit) als Text im Format JJJJ-MM-TT, z. B. "2026-10-09".
    // Dieses Format verwendet auch das Datumsfeld, deshalb lassen sich beide direkt vergleichen.
    // padStart(2, '0') macht aus "7" eine "07".
    heute() {
      const jetzt = new Date();
      const jahr = jetzt.getFullYear();
      const monat = String(jetzt.getMonth() + 1).padStart(2, '0');   // getMonth() zählt ab 0
      const tag = String(jetzt.getDate()).padStart(2, '0');
      return `${jahr}-${monat}-${tag}`;
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
        }

        // Volumen: Buchstaben, Ziffern, Leerzeichen und . , ' / + -
        const volumen = f.volumen.trim();
        if (volumen === '') {
          fehler.volumen = 'Bitte geben Sie das ungefähre Volumen an.';
        } else if (!/^[\p{L}\p{N} .,'\/+-]+$/u.test(volumen)) {
          fehler.volumen = 'Das Volumen enthält unzulässige Zeichen.';
        }

        // Wunschdatum ist freiwillig. Wenn eins gewählt ist, darf es nicht vor heute liegen.
        // Bei Texten im Format JJJJ-MM-TT entspricht der Textvergleich (<) der Datumsreihenfolge.
        if (f.wunschdatum !== '' && f.wunschdatum < this.heute) {
          fehler.wunschdatum = 'Das Wunschdatum darf nicht in der Vergangenheit liegen.';
        }
        // Zeitfenster ist freiwillig und wird nicht geprüft
      }

      this.fehler = fehler;
      return Object.keys(fehler).length === 0;   // keine Einträge = alles gültig
    },

    // Wird beim Klick auf "Spende registrieren" aufgerufen
    absenden() {
      this.eingabeGueltig = this.pruefen();
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
