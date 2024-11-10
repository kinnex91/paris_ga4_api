import express from 'express';
import { google } from 'googleapis';
import fs from 'fs';
import cors from 'cors';
import dotenv from 'dotenv';

// Charger les variables d'environnement depuis le fichier .env
dotenv.config();

const app = express();
const PORT = process.env.PORT_BACKEND;

// Configurer CORS pour autoriser les requêtes du frontend
app.use(cors());

// Remplace par ton Property ID (GA4)
const PROPERTY_ID = process.env.GA_PROPERTY_ID;

// Charger le fichier JSON du Service Account
const serviceAccount = JSON.parse(fs.readFileSync('./service-account.json', 'utf8'));

// Configurer l'authentification avec Google Auth
const auth = new google.auth.GoogleAuth({
  credentials: serviceAccount,
  scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
});

// Initialiser l'API Google Analytics Data
const analyticsData = google.analyticsdata('v1beta');

app.get('/api/analytics', async (req, res) => {
  try {
    console.log('Fetching Google Analytics data...');

    // Obtenir le token d'accès
    const authClient = await auth.getClient();
    const accessToken = await authClient.getAccessToken();

    // Effectuer une requête à l'API pour récupérer les données
    const response = await analyticsData.properties.runReport({
      property: `properties/${PROPERTY_ID}`,
      auth: authClient,
      requestBody: {
        dateRanges: [{ startDate: '365daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'date' }],
        metrics: [{ name: 'activeUsers' },{ name:  'newUsers' },{ name:  'sessions' },{ name:  'averageSessionDuration' }] ,
      },
      
    });
    console.log('Fetching ended..');
    // Renvoyer les données au frontend
    res.json(response.data);
  } catch (error) {
    console.error('Erreur lors de la récupération des données :', error);
    res.status(500).send('Erreur lors de la récupération des données');
  }
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
  console.log(`Utilisez l'URL suivante pour accéder aux données : http://localhost:${PORT}/api/analytics`);
});
