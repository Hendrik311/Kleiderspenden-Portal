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
      }
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
