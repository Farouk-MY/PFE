export const calculatePoints = (panier: any) => {
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