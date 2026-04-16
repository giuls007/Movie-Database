const express = require('express'); // Carica il framework per gestire il server
const fs = require('fs');           // Modulo nativo di Node per leggere i file (File System)
const csv = require('csv-parser');  // Libreria esterna per convertire il formato CSV in oggetti JS
const xml2js = require('xml2js');   // Libreria esterna per convertire l'XML in oggetti JS

const app = express();
const PORT = 3000;

// Configura la cartella 'public' come sorgente dei file statici (HTML, CSS, Immagini)
app.use(express.static('public'));

/**
 * Rotta API che raccoglie i dati dai 3 formati e li unisce in un unico JSON
 */
app.get('/api/film', async (req, res) => {
    try {
        let databaseFilm = []; // Array temporaneo che conterrà tutti i film

        // --- GESTIONE JSON ---
        // Leggiamo il file in modo sincrono e lo trasformiamo subito in oggetto JS
        const datiJson = JSON.parse(fs.readFileSync('./data/film.json', 'utf8'));
        // Aggiungiamo ogni film all'array globale aggiungendo l'etichetta del formato
        datiJson.forEach(f => databaseFilm.push({ ...f, tipo: 'JSON' }));

        // --- GESTIONE XML ---
        // Leggiamo il testo grezzo del file XML
        const datiXml = fs.readFileSync('./data/film.xml', 'utf8');
        const parser = new xml2js.Parser({ explicitArray: false });
        // Trasformiamo l'XML in un oggetto JavaScript navigabile
        const resultXml = await parser.parseStringPromise(datiXml);
        // Navighiamo dentro <cineteca><film> e aggiungiamo i dati all'array
        resultXml.cineteca.film.forEach(f => databaseFilm.push({ ...f, tipo: 'XML' }));

        // --- GESTIONE CSV ---
        // Il CSV si legge "a pezzi" (stream) perché potrebbe essere un file enorme
        fs.createReadStream('./data/film.csv')
            .pipe(csv()) // Trasforma ogni riga del CSV in un oggetto
            .on('data', (row) => databaseFilm.push({ ...row, tipo: 'CSV' }))
            .on('end', () => {
                // Solo quando il CSV è finito inviamo la risposta completa al browser
                res.json(databaseFilm);
            });

    } catch (err) {
        // Se un file manca o è scritto male, inviamo un errore 500
        console.error("Errore critico:", err);
        res.status(500).send("Errore nel caricamento dei dati");
    }
});

// Avvia il server sulla porta 3000
app.listen(PORT, () => console.log(`Server attivo su http://localhost:${PORT}`));