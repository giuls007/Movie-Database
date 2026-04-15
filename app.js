/**
 * Applicazione: Magazzino Supermercato
 * Gestione obbligatoria formati: JSON, XML, CSV.
 */

const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { Parser } = require('json2csv'); 
const xml2js = require('xml2js');

const app = express();
const PORT = 3000;

// Percorsi ai file nella cartella 'data'
const DB_JSON = path.join(__dirname, 'data', 'magazzino.json');
const IMPORT_XML = path.join(__dirname, 'data', 'carico_merce.xml');

app.use(express.json());

/**
 * Endpoint per esportare in magazzino.csv
 * Risolve il problema delle virgole rosse nell'editor usando il punto e virgola.
 */
app.get('/esporta-csv', async (req, res) => {
    try {
        const data = await fs.readFile(DB_JSON, 'utf8');
        const prodotti = JSON.parse(data);
        
        // Configurazione: usiamo il punto e virgola (;) come delimitatore
        const opts = { 
            delimiter: ';', 
            quote: '' // Rimuove le virgolette superflue per un CSV più pulito
        }; 
        const parser = new Parser(opts);
        const csv = parser.parse(prodotti);
        
        res.header('Content-Type', 'text/csv');
        res.attachment('magazzino.csv');
        res.send(csv);
    } catch (err) {
        res.status(500).send("Errore nella generazione del CSV.");
    }
});

// Endpoint per vedere i dati in formato JSON (obbligatorio)
app.get('/prodotti', async (req, res) => {
    try {
        const data = await fs.readFile(DB_JSON, 'utf8');
        res.json(JSON.parse(data));
    } catch (err) {
        res.status(500).send("Errore lettura database.");
    }
});

// Endpoint per importare da XML (obbligatorio)
app.post('/importa-xml', async (req, res) => {
    try {
        const xmlContent = await fs.readFile(IMPORT_XML, 'utf8');
        const parser = new xml2js.Parser({ explicitArray: false });
        const result = await parser.parseStringPromise(xmlContent);
        
        const nuovi = Array.isArray(result.lista.articolo) ? result.lista.articolo : [result.lista.articolo];
        const vecchi = JSON.parse(await fs.readFile(DB_JSON, 'utf8'));
        
        await fs.writeFile(DB_JSON, JSON.stringify([...vecchi, ...nuovi], null, 2));
        res.json({ messaggio: "Importazione completata", aggiunti: nuovi.length });
    } catch (err) {
        res.status(500).send("Errore importazione XML.");
    }
});

app.listen(PORT, () => console.log(`Server Magazzino su http://localhost:${PORT}`));