"use client"

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ProfileSidebar } from '@/components/profile-sidebar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Camera, Bell, Smartphone, Mail, Shield, Key, CreditCard } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

export default function SettingsPage() {
  const { user, updateProfile, fetchUserProfile } = useAuthStore()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Format initials for avatar
  const initials = user ? `${user.prenom?.[0] || ''}${user.nom?.[0] || ''}` : ''

  const [formData, setFormData] = useState({
    nom: user?.nom || '',
    prenom: user?.prenom || '',
    email: user?.email || '',
    telephone: user?.telephone || '',
    ville: user?.ville || '',
    codePostal: user?.codePostal || '',
    gouvernorat: user?.gouvernorat || '',
  })



  // Sync formData when user data changes
  useEffect(() => {
    if (user) {
      setFormData({
        nom: user.nom || '',
        prenom: user.prenom || '',
        email: user.email || '',
        telephone: user.telephone || '',
        ville: user.ville || '',
        codePostal: user.codePostal || '',
        gouvernorat: user.gouvernorat || '',
      })
    }
  }, [user])

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const updateData = {
        nom: formData.nom,
        prenom: formData.prenom,
        telephone: formData.telephone,
        ville: formData.ville,
        codePostal: formData.codePostal,
        gouvernorat: formData.gouvernorat,
      }

      const result = await updateProfile(updateData)

      if (result.success) {
        // Refresh user data after update
        await fetchUserProfile()

        toast({
          title: "Profil mis à jour",
          description: "Vos informations de profil ont été mises à jour avec succès.",
          variant: "default",
        })

        setIsEditing(false)
      } else {
        throw new Error(result.error || "Erreur lors de la mise à jour")
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

  return (
      <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50 pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <ProfileSidebar />

            <div className="flex-1 space-y-8">
              <Tabs defaultValue="profile" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="profile">Profil</TabsTrigger>
                  <TabsTrigger value="notifications">Notifications</TabsTrigger>
                  <TabsTrigger value="billing">Facturation</TabsTrigger>
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
                        <h2 className="text-2xl font-bold">{user?.prenom} {user?.nom}</h2>
                        <p className="text-muted-foreground">{user?.email}</p>
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
                      </div>
                      <div className="space-y-4">
                        <div>
                          <Label>Ville</Label>
                          <Input
                              value={formData.ville}
                              onChange={(e) =>
                                  setFormData({ ...formData, ville: e.target.value })
                              }
                              disabled={!isEditing}
                          />
                        </div>
                        <div>
                          <Label>Code Postal</Label>
                          <Input
                              value={formData.codePostal}
                              onChange={(e) =>
                                  setFormData({ ...formData, codePostal: e.target.value })
                              }
                              disabled={!isEditing}
                          />
                        </div>
                        <div>
                          <Label>Gouvernorat</Label>
                          <Input
                              value={formData.gouvernorat}
                              onChange={(e) =>
                                  setFormData({ ...formData, gouvernorat: e.target.value })
                              }
                              disabled={!isEditing}
                          />
                        </div>
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

                <TabsContent value="notifications" className="mt-6">
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
                              Recevoir les mises à jour des commandes et les annonces
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
                            <p className="font-medium">Notifications push</p>
                            <p className="text-sm text-muted-foreground">
                              Recevoir des mises à jour en temps réel sur votre appareil
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
                            <p className="font-medium">Notifications SMS</p>
                            <p className="text-sm text-muted-foreground">
                              Recevoir des mises à jour par message texte
                            </p>
                          </div>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </Card>
                </TabsContent>

                <TabsContent value="billing" className="mt-6">
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-6">
                      Méthodes de paiement
                    </h3>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="bg-primary/10 p-2 rounded-lg">
                            <CreditCard className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">Ajouter une méthode de paiement</p>
                            <p className="text-sm text-muted-foreground">
                              Ajouter une nouvelle carte de crédit ou méthode de paiement
                            </p>
                          </div>
                        </div>
                        <Button>Ajouter une méthode</Button>
                      </div>
                    </div>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
  )
}