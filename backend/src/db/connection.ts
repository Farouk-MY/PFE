import pg from 'pg';
const { Pool } = pg;

// Configuration pour la base de données locale
const localPoolConfig = {
    user: 'postgres',       // Utilisateur PostgreSQL
    password: '0000',       // Mot de passe PostgreSQL
    host: 'localhost',      // Hôte de la base de données
    port: 5432,             // Port de la base de données
    database: 'mediasoft',  // Nom de la base de données
    ssl: false              // Désactive SSL
};

// Configuration pour la base de données distante (via DATABASE_URL)
const remotePoolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: false              // Désactive SSL
};

// Sélection de la configuration en fonction de la présence de DATABASE_URL
const poolConfig = process.env.DATABASE_URL ? remotePoolConfig : localPoolConfig;

// Création du pool de connexions
const pool = new Pool(poolConfig);

// Test de la connexion à la base de données
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Erreur de connexion à la base de données:', err);
    } else {
        console.log('Connexion à la base de données réussie. Heure actuelle:', res.rows[0].now);
    }
});

// Exportation du pool pour être utilisé dans d'autres fichiers
export default pool;