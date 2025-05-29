"use client"

import { useState, useEffect } from 'react'
import { useAdminAuthStore } from '@/store'
import { AdminSidebar } from '@/components/admin-sidebar'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Camera,
  Bell,
  Smartphone,
  Mail,
  Shield,
  Key,
  User,
  AlertCircle,
  Clock,
  Shield as ShieldIcon
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { Alert, AlertDescription } from '@/components/ui/alert'

// Interface for lastLogin property in admin profile
interface AdminWithLastLogin {
  lastLogin?: string;
}

export default function AdminSettingsPage() {
  const { admin, updateProfile, fetchAdminProfile, changePassword, error, clearError } = useAdminAuthStore()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false)

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordError, setPasswordError] = useState<string | null>(null)

  // Format initials for avatar
  const initials = admin ? `${admin.prenom?.[0] || ''}${admin.nom?.[0] || ''}` : ''

  const [formData, setFormData] = useState({
    nom: admin?.nom || '',
    prenom: admin?.prenom || '',
    email: admin?.email || '',
    telephone: admin?.telephone || '',
    role: admin?.role || '',
  })

  // Sync formData when admin data changes
  useEffect(() => {
    if (admin) {
      setFormData({
        nom: admin.nom || '',
        prenom: admin.prenom || '',
        email: admin.email || '',
        telephone: admin.telephone || '',
        role: admin.role || '',
      })
    }
  }, [admin])

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const updateData = {
        nom: formData.nom,
        prenom: formData.prenom,
        telephone: formData.telephone,
      }

      const success = await updateProfile(updateData)

      if (success) {
        // Refresh admin data after update
        await fetchAdminProfile()

        toast({
          title: "Profil mis à jour",
          description: "Vos informations de profil ont été mises à jour avec succès.",
          variant: "default",
        })

        setIsEditing(false)
      } else {
        throw new Error("Erreur lors de la mise à jour")
      }
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du profil:', error)
      toast({
        title: "Échec de la mise à jour",
        description: error.message || "Un problème est survenu lors de la mise à jour de votre profil. Veuillez réessayer.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError(null)

    // Validate passwords match
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("Les mots de passe ne correspondent pas")
      return
    }

    // Validate password strength
    if (passwordData.newPassword.length < 8) {
      setPasswordError("Le mot de passe doit contenir au moins 8 caractères")
      return
    }

    setIsLoading(true)
    try {
      const result = await changePassword(
          passwordData.currentPassword,
          passwordData.newPassword,
          passwordData.confirmPassword
      )

      if (result.success) {
        toast({
          title: "Mot de passe mis à jour",
          description: "Votre mot de passe a été modifié avec succès.",
          variant: "default",
        })

        // Clear form
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
      } else {
        setPasswordError(result.error || "Une erreur est survenue")
      }
    } catch (error: any) {
      setPasswordError(error.message || "Une erreur est survenue")
    } finally {
      setIsLoading(false)
    }
  }

  // Safe access to lastLogin property by type assertion
  const adminWithLastLogin = admin as AdminWithLastLogin & typeof admin
  const lastLoginDate = adminWithLastLogin?.lastLogin ? new Date(adminWithLastLogin.lastLogin) : null

  return (
      <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50">
        <div className="flex">
          <AdminSidebar />

          <div className="flex-1 p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Paramètres du profil</h1>
              <p className="text-muted-foreground">
                Gérez vos informations personnelles et préférences
              </p>
            </div>

            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="profile">Profil</TabsTrigger>
                <TabsTrigger value="security">Sécurité</TabsTrigger>
                <TabsTrigger value="preferences">Préférences</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="mt-6">
                <Card className="p-6">
                  <div className="flex items-center gap-6 pb-6 border-b">
                    <div className="relative">
                      <Avatar className="h-24 w-24">
                        <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-600 to-purple-600 text-white">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <Button
                          size="icon"
                          className="absolute bottom-0 right-0 rounded-full"
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{admin?.prenom} {admin?.nom}</h2>
                      <p className="text-muted-foreground">{admin?.email}</p>
                      <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {admin?.role}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div className="space-y-4">
                      <div>
                        <Label>Prénom</Label>
                        <Input
                            value={formData.prenom}
                            onChange={(e) =>
                                setFormData({ ...formData, prenom: e.target.value })
                            }
                            disabled={!isEditing}
                        />
                      </div>
                      <div>
                        <Label>Nom</Label>
                        <Input
                            value={formData.nom}
                            onChange={(e) =>
                                setFormData({ ...formData, nom: e.target.value })
                            }
                            disabled={!isEditing}
                        />
                      </div>
                      <div>
                        <Label>Email</Label>
                        <Input
                            type="email"
                            value={formData.email}
                            disabled
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label>Téléphone</Label>
                        <Input
                            value={formData.telephone}
                            onChange={(e) =>
                                setFormData({ ...formData, telephone: e.target.value })
                            }
                            disabled={!isEditing}
                        />
                      </div>
                      <div>
                        <Label>Rôle</Label>
                        <Input
                            value={formData.role}
                            disabled
                        />
                      </div>
                      {/* Only show last login if it exists */}
                      {lastLoginDate && (
                          <div>
                            <Label>Dernière connexion</Label>
                            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              {lastLoginDate.toLocaleString()}
                            </div>
                          </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-4 mt-6 pt-6 border-t">
                    {isEditing ? (
                        <>
                          <Button
                              variant="outline"
                              onClick={() => setIsEditing(false)}
                              disabled={isLoading}
                          >
                            Annuler
                          </Button>
                          <Button
                              onClick={handleSave}
                              disabled={isLoading}
                          >
                            {isLoading ? 'Enregistrement...' : 'Enregistrer les modifications'}
                          </Button>
                        </>
                    ) : (
                        <Button onClick={() => setIsEditing(true)}>
                          Modifier le profil
                        </Button>
                    )}
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="security" className="mt-6">
                <div className="grid gap-6">
                  {/* Two Factor Authentication */}
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-6">
                      Authentification à deux facteurs
                    </h3>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="bg-primary/10 p-2 rounded-lg">
                          <ShieldIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">Authentification à deux facteurs</p>
                          <p className="text-sm text-muted-foreground">
                            {admin?.twoFactorEnabled
                                ? "Activée - Votre compte est protégé par une authentification à deux facteurs"
                                : "Désactivée - Activez cette option pour renforcer la sécurité de votre compte"}
                          </p>
                        </div>
                      </div>
                      <Button
                          onClick={() => setShowTwoFactorSetup(!showTwoFactorSetup)}
                          variant={admin?.twoFactorEnabled ? "outline" : "default"}
                      >
                        {admin?.twoFactorEnabled ? "Gérer" : "Activer"}
                      </Button>
                    </div>

                    {showTwoFactorSetup && (
                        <div className="border-t pt-6">
                          <p className="mb-4">
                            Pour configurer l'authentification à deux facteurs, suivez ces étapes:
                          </p>
                          <ol className="list-decimal pl-5 space-y-2 mb-6">
                            <li>Scannez le code QR avec une application d'authentification (Google Authenticator, Authy)</li>
                            <li>Entrez le code à 6 chiffres généré par l'application</li>
                            <li>Conservez précieusement vos codes de secours</li>
                          </ol>
                          <div className="mt-4">
                            <Button>
                              Configurer l'authentification à deux facteurs
                            </Button>
                          </div>
                        </div>
                    )}
                  </Card>

                  {/* Change Password */}
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-6">
                      Changer de mot de passe
                    </h3>

                    {passwordError && (
                        <Alert variant="destructive" className="mb-6">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{passwordError}</AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={handlePasswordChange} className="space-y-4">
                      <div>
                        <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                        <div className="relative">
                          <Input
                              id="currentPassword"
                              type="password"
                              value={passwordData.currentPassword}
                              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                              className="pl-10"
                              required
                          />
                          <Key className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                        <div className="relative">
                          <Input
                              id="newPassword"
                              type="password"
                              value={passwordData.newPassword}
                              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                              className="pl-10"
                              required
                          />
                          <Key className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
                        <div className="relative">
                          <Input
                              id="confirmPassword"
                              type="password"
                              value={passwordData.confirmPassword}
                              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                              className="pl-10"
                              required
                          />
                          <Key className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                        </div>
                      </div>

                      <div className="pt-2">
                        <Button
                            type="submit"
                            disabled={isLoading}
                        >
                          {isLoading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
                        </Button>
                      </div>
                    </form>
                  </Card>

                  {/* Session Security */}
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-6">
                      Sécurité de session
                    </h3>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="bg-primary/10 p-2 rounded-lg">
                            <Shield className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">Déconnexion automatique</p>
                            <p className="text-sm text-muted-foreground">
                              Déconnexion après 30 minutes d'inactivité
                            </p>
                          </div>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="preferences" className="mt-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-6">
                    Préférences de notification
                  </h3>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="bg-primary/10 p-2 rounded-lg">
                          <Mail className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">Notifications par email</p>
                          <p className="text-sm text-muted-foreground">
                            Recevoir les nouvelles commandes et alertes du système
                          </p>
                        </div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="bg-primary/10 p-2 rounded-lg">
                          <Bell className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">Notifications du tableau de bord</p>
                          <p className="text-sm text-muted-foreground">
                            Afficher les notifications dans le tableau de bord admin
                          </p>
                        </div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="bg-primary/10 p-2 rounded-lg">
                          <Smartphone className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">Notifications mobiles</p>
                          <p className="text-sm text-muted-foreground">
                            Envoyer des notifications sur votre appareil mobile
                          </p>
                        </div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </Card>

                <Card className="p-6 mt-6">
                  <h3 className="text-lg font-semibold mb-6">
                    Interface du tableau de bord
                  </h3>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Mode sombre</p>
                        <p className="text-sm text-muted-foreground">
                          Activer le thème sombre pour l'interface
                        </p>
                      </div>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Affichage compact</p>
                        <p className="text-sm text-muted-foreground">
                          Réduire l'espacement pour afficher plus de contenu
                        </p>
                      </div>
                      <Switch />
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
  )
}