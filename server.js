const express = require('express');
const cors = require('cors');
const fs = require('fs');
const app = express();

app.use(cors());
app.use(express.json());

const DATA_FILE = './data.json';

// Charger ou initialiser les données
function loadData() {
    if (!fs.existsSync(DATA_FILE)) {
        // Structure de base vide avec les totaux demandés
        const initialData = {
            survivors: Array.from({length: 45}, (_, i) => ({ id: `surv_${i+1}`, name: `Survivant ${i+1}`, unlocked: false, rarity: i < 10 ? 'common' : i < 30 ? 'rare' : 'epic' })),
            killers: Array.from({length: 37}, (_, i) => ({ id: `killer_${i+1}`, name: `Tueur ${i+1}`, unlocked: false, rarity: i < 8 ? 'common' : i < 25 ? 'rare' : 'epic' })),
            'perks-surv': Array.from({length: 135}, (_, i) => ({ id: `psurv_${i+1}`, name: `Perk Surv ${i+1}`, unlocked: false, rarity: i < 40 ? 'common' : 'rare' })),
            'perks-killer': Array.from({length: 110}, (_, i) => ({ id: `pkiller_${i+1}`, name: `Perk Tueur ${i+1}`, unlocked: false, rarity: i < 35 ? 'common' : 'rare' }))
        };
        fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
    }
    return JSON.parse(fs.readFileSync(DATA_FILE));
}

// Route pour que la page web récupère l'état actuel
app.get('/api/collection', (req, res) => {
    const data = loadData();
    res.json(data);
});

// Route déclenchée par le Bot Twitch (ex: via un webhook ou une requête HTTP simple) quand quelqu'un tape !dbdcollec
app.post('/api/roll', (req, res) => {
    const data = loadData();
    
    // Regrouper tous les éléments encore verrouillés
    let lockedItems = [];
    Object.keys(data).forEach(category => {
        data[category].forEach(item => {
            if (!item.unlocked) {
                lockedItems.push({ category, item });
            }
        });
    });

    if (lockedItems.length === 0) {
        return res.json({ success: false, message: "La collection est déjà 100% complète !" });
    }

    // Tirage au sort aléatoire parmi les verrouillés
    const randomIndex = Math.floor(Math.random() * lockedItems.length);
    const selected = lockedItems[randomIndex];

    // Déverrouiller l'élément
    selected.item.unlocked = true;

    // Sauvegarder dans le fichier JSON
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

    res.json({
        success: true,
        unlockedName: selected.item.name,
        category: selected.category
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur de collection DBD actif sur le port ${PORT}`));