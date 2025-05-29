// User related interfaces
export interface Utilisateur {
  id: number
  nom: string
  prenom: string
  email: string
  telephone: string
  ville: string
  codePostal: string
  gouvernorat: string
  motDePasse: string
  role: string
  inscritLe: Date
  statut: string
  client?: Client
  admin?: Admin
  avis: Avis[]
  notification: Notification[]
  chatbot?: Chatbot
  resetTokens: ResetToken[]
  messageries: Messagerie[]
}

export interface Client {
  id: number
  soldePoints: number
  historiqueAchats?: Record<string, any>
  historiquePoints?: Record<string, any>
  utilisateur: Utilisateur
  panier: Panier[]
  commande: Commande[]
  produitsAchetes: Produit[]
}

export interface Admin {
  id: number
  utilisateur: Utilisateur
}

// Product related interfaces
export interface Produit {
  id: number
  designation: string
  description?: string
  images: string[]
  qteStock: number
  prix: number
  nbrPoint: number
  seuilMin: number
  deleted: boolean
  lignePanier: LignePanier[]
  avis: Avis[]
  clientsAcheteurs: Client[]
}

// Cart related interfaces
export interface Panier {
  id: number
  date: Date
  total: number
  remise: number
  livrerDomicile: boolean
  client: Client
  client_id: number
  lignePanier: LignePanier[]
  commande: Commande[]
}

export interface LignePanier {
  id: number
  prix: number
  qteCmd: number
  sousTotal: number
  panier: Panier
  panier_id: number
  produit: Produit
  produit_id: number
}

// Order and payment interfaces
export interface Commande {
  id: number
  total: number
  remise: number
  pourcentageRemise?: number
  montantPoint: number
  montantLivraison: number
  montantAPayer: number
  dateLivraison: Date
  pointsGagnes: number
  pointsUtilises: number
  client: Client
  client_id: number
  panier: Panier
  panier_id: number
  livraison: Livraison[]
  paiement?: Paiement
}

export interface Livraison {
  id: number
  date: Date
  nomLivreur: string
  statutLivraison: string
  detailPaiement: string
  commande: Commande
  commande_id: number
}

export interface Paiement {
  id: number
  montant: number
  methode: string
  detailsCarte?: Record<string, any>
  statut: string
  date: Date
  commande: Commande
  commande_id: number
}

// Review and communication interfaces
export interface Avis {
  id: number
  date: Date
  note: number
  commentaire?: string
  utilisateur: Utilisateur
  utilisateur_id: number
  produit?: Produit
  produit_id?: number
}

export interface Notification {
  id: number
  message: string
  dateEnvoi: Date
  statut: string
  utilisateur: Utilisateur
  utilisateur_id: number
}

export interface Chatbot {
  id: number
  utilisateur: Utilisateur
  utilisateur_id: number
}

export interface Messagerie {
  id: number
  contenu: string
  date_envoi: Date
  lu: boolean
  utilisateur: Utilisateur
  utilisateur_id: number
  parent_message_id?: number
  parentMessage?: Messagerie
  replies: Messagerie[]
}

export interface ResetToken {
  id: number
  token: string
  utilisateur_id: number
  utilisateur: Utilisateur
  expiresAt: Date
}