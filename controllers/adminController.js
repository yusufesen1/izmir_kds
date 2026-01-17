const pool = require('../db/db');

exports.addTariff = async (req, res) => {
    const { ad, ucret, aktarma_suresi } = req.body;
    try {
        const result = await pool.query(
            "INSERT INTO ucret_tarifesi (ad, ucret, aktarma_suresi_dk) VALUES ($1, $2, $3) RETURNING *",
            [ad, ucret, aktarma_suresi]
        );
        res.status(201).json({ message: "Tarife eklendi", data: result.rows[0] });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.updateTariff = async (req, res) => {
    const { id } = req.params;
    const { yeni_ucret } = req.body;
    try {
        const result = await pool.query(
            "UPDATE ucret_tarifesi SET ucret = $1 WHERE id = $2 RETURNING *",
            [yeni_ucret, id]
        );
        res.json({ message: "Fiyat güncellendi", data: result.rows[0] });
    } catch (err) {
        res.status(400).json({ error: err.message }); 
    }
};

exports.deleteTariff = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query("DELETE FROM ucret_tarifesi WHERE id = $1", [id]);
        res.json({ message: "Tarife silindi" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.getAllTariffs = async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM ucret_tarifesi ORDER BY id");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};