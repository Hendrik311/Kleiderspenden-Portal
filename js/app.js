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
      ]
    };
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
