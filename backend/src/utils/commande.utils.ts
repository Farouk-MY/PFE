interface LigneHistoriqueAchat {
    date: Date;
    produitId: number;
    designation: string;
    quantite: number;
    prixUnitaire: number;
    total: number;
}

interface HistoriquePoints {
    date: Date;
    type: 'gain' | 'utilisation';
    points: number;
    solde: number;
}

export const formatHistoriqueAchat = (panier: any): LigneHistoriqueAchat[] => {
    return panier.lignePanier.map((ligne: any) => ({
        date: new Date(),
        produitId: ligne.produit_id,
        designation: ligne.produit.designation,
        quantite: ligne.qteCmd,
        prixUnitaire: ligne.prix,
        total: ligne.sousTotal
    }));
};

export const formatHistoriquePoints = (client: any, pointsGagnes: number, pointsUtilises: number): HistoriquePoints => {
    return {
        date: new Date(),
        type: pointsGagnes > 0 ? 'gain' : 'utilisation',
        points: pointsGagnes > 0 ? pointsGagnes : pointsUtilises,
        solde: client.soldePoints + pointsGagnes - pointsUtilises
    };
};

export const calculatePoints = (panier: any): number => {
    return panier.lignePanier.reduce((total: number, ligne: any) => {
        return total + (ligne.produit.nbrPoint * ligne.qteCmd);
    }, 0);
};

export const calculateDiscount = (pointsDisponibles: number, totalPanier: number) => {
    // Calculate how many 2000 point blocks we can use (max 5 blocks)
    const blocksOf2000Points = Math.min(Math.floor(pointsDisponibles / 2000), 5);

    // Calculate discount percentage (10% per block)
    const pourcentageRemise = blocksOf2000Points * 10;

    // Calculate discount amount in TND
    return {
        pourcentage: pourcentageRemise,
        montant: totalPanier * (pourcentageRemise / 100),
        pointsUtilises: blocksOf2000Points * 2000
    };
};