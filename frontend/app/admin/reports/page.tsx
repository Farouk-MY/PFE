"use client"

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '@/components/language-provider'
import '@/i18n'
import { AdminSidebar } from '@/components/admin-sidebar'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { toast } from 'sonner'
import {
    Search,
    Mail,
    Filter,
    MoreVertical,
    Send,
    Loader2,
    CheckCircle,
    XCircle,
    Clock,
    AlertCircle,
    FileText,
    Calendar,
    Tag,
    User,
    BarChart4,
    ArrowUpDown,
    ChevronRight,
    MessageSquare,
    Trash2,
} from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"
import { useAdminControllerStore } from '@/store'

export default function AdminReports() {
    // Initialize i18n translation
    const { t } = useTranslation(['reports', 'common']);
    const { language } = useLanguage();
    const {
        contacts,
        contactStats,
        getAllContacts,
        getContactById,
        updateContactStatus,
        updateContactPriority,
        replyToContact,
        deleteContact,
        getContactStats,
        isLoading,
        error
    } = useAdminControllerStore();

    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [typeFilter, setTypeFilter] = useState('all')
    const [priorityFilter, setPriorityFilter] = useState('all')
    const [selectedMessage, setSelectedMessage] = useState<any>(null)
    const [replyModalOpen, setReplyModalOpen] = useState(false)
    const [detailsModalOpen, setDetailsModalOpen] = useState(false)
    const [replyText, setReplyText] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [activeTab, setActiveTab] = useState('all')

    useEffect(() => {
        const loadData = async () => {
            await getAllContacts();
            await getContactStats();
        };
        loadData();
    }, []);

    useEffect(() => {
        if (error) {
            toast.error(error);
        }
    }, [error]);

    // Filter messages based on search query and filters
    const filteredMessages = contacts.filter(message => {
        const matchesSearch =
            message.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            message.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            message.subject.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesStatus = statusFilter === 'all' || message.status === statusFilter
        const matchesType = typeFilter === 'all' || message.type === typeFilter
        const matchesPriority = priorityFilter === 'all' || message.priority === priorityFilter

        // Filter by tab (status groups)
        if (activeTab === 'all') return matchesSearch && matchesStatus && matchesType && matchesPriority
        if (activeTab === 'unresolved') return (message.status === 'pending' || message.status === 'in_progress') && matchesSearch && matchesType && matchesPriority
        if (activeTab === 'resolved') return message.status === 'resolved' && matchesSearch && matchesType && matchesPriority
        if (activeTab === 'high_priority') return message.priority === 'high' && matchesSearch && matchesStatus && matchesType

        return matchesSearch && matchesStatus && matchesType && matchesPriority
    })

    const handleReply = async () => {
        if (!replyText.trim()) {
            toast.error("Please enter a reply message")
            return
        }

        if (!selectedMessage) return;

        setIsSubmitting(true)
        try {
            const success = await replyToContact(selectedMessage.id, replyText)
            if (success) {
                toast.success("Reply sent successfully!")
                setReplyModalOpen(false)
                setReplyText('')
                // Refresh the contact details
                const updatedContact = await getContactById(selectedMessage.id)
                setSelectedMessage(updatedContact)
            }
        } catch (err) {
            toast.error("Failed to send reply. Please try again.")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleStatusChange = async (messageId: number, newStatus: 'pending' | 'in_progress' | 'resolved') => {
        try {
            const updatedContact = await updateContactStatus(messageId, newStatus)
            if (updatedContact) {
                toast.success(`Message status updated to ${newStatus}`)
                // If we're viewing this message in details modal, update it
                if (selectedMessage && selectedMessage.id === messageId) {
                    setSelectedMessage(updatedContact)
                }
            }
        } catch (err) {
            toast.error("Failed to update status. Please try again.")
        }
    }

    const handlePriorityChange = async (messageId: number, newPriority: 'low' | 'medium' | 'high') => {
        try {
            const updatedContact = await updateContactPriority(messageId, newPriority)
            if (updatedContact) {
                toast.success(`Message priority updated to ${newPriority}`)
                // If we're viewing this message in details modal, update it
                if (selectedMessage && selectedMessage.id === messageId) {
                    setSelectedMessage(updatedContact)
                }
            }
        } catch (err) {
            toast.error("Failed to update priority. Please try again.")
        }
    }

    const handleDeleteContact = async (messageId: number) => {
        try {
            const success = await deleteContact(messageId)
            if (success) {
                toast.success("Message deleted successfully")
                if (selectedMessage && selectedMessage.id === messageId) {
                    setDetailsModalOpen(false)
                }
            }
        } catch (err) {
            toast.error("Failed to delete message. Please try again.")
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" /> {t('pending')}</Badge>
            case 'in_progress':
                return <Badge variant="default" className="bg-blue-500"><MessageSquare className="mr-1 h-3 w-3" /> {t('inProgress')}</Badge>
            case 'resolved':
                return <Badge variant="default" className="bg-green-500"><CheckCircle className="mr-1 h-3 w-3" /> {t('resolved')}</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case 'high':
                return <Badge variant="destructive"><AlertCircle className="mr-1 h-3 w-3" /> {t('high')}</Badge>
            case 'medium':
                return <Badge variant="default" className="bg-yellow-500"><ArrowUpDown className="mr-1 h-3 w-3" /> {t('medium')}</Badge>
            case 'low':
                return <Badge variant="default" className="bg-green-500"><ChevronRight className="mr-1 h-3 w-3" /> {t('low')}</Badge>
            default:
                return <Badge variant="outline">{priority}</Badge>
        }
    }

    const getTypeBadge = (type: string) => {
        switch (type) {
            case 'general':
                return <Badge variant="outline" className="bg-gray-100 text-gray-700"><MessageSquare className="mr-1 h-3 w-3" /> {t('general')}</Badge>
            case 'support':
                return <Badge variant="outline" className="bg-blue-100 text-blue-800"><AlertCircle className="mr-1 h-3 w-3" /> {t('support')}</Badge>
            case 'sales':
                return <Badge variant="outline" className="bg-green-100 text-green-800"><Tag className="mr-1 h-3 w-3" /> Sales</Badge>
            default:
                return <Badge variant="outline">{type}</Badge>
        }
    }

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(part => part[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    }

    const stats = contactStats || {
        total: 0,
        pending: 0,
        inProgress: 0,
        resolved: 0,
        highPriority: 0,
        today: 0
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="flex">
                <AdminSidebar />

                <div className="flex-1 p-8">
                    <div className="mb-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold mb-2">{t('contactReports')}</h1>
                                <p className="text-muted-foreground">
                                    {t('overview')}
                                </p>
                            </div>
                            <div>
                                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                                    <BarChart4 className="mr-2 h-4 w-4" />
                                    {t('common:generateReport')}
                                </Button>
                            </div>
                        </div>
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
                        <TabsList className="grid grid-cols-4 w-full max-w-md">
                            <TabsTrigger value="all">{t('all')} ({stats.total})</TabsTrigger>
                            <TabsTrigger value="unresolved">{t('unresolved')} ({stats.pending + stats.inProgress})</TabsTrigger>
                            <TabsTrigger value="resolved">{t('resolved')} ({stats.resolved})</TabsTrigger>
                            <TabsTrigger value="high_priority">{t('highPriority')} ({stats.highPriority})</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <Card className="mb-6">
                        <div className="p-6 space-y-4">
                            <div className="flex flex-col md:flex-row gap-4 md:items-center">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder={t('search')}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger className="w-full sm:w-[160px]">
                                            <SelectValue placeholder={t('status')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectLabel>{t('status')}</SelectLabel>
                                                <SelectItem value="all">{t('all')}</SelectItem>
                                                <SelectItem value="pending">{t('pending')}</SelectItem>
                                                <SelectItem value="in_progress">{t('inProgress')}</SelectItem>
                                                <SelectItem value="resolved">{t('resolved')}</SelectItem>
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                                        <SelectTrigger className="w-full sm:w-[160px]">
                                            <SelectValue placeholder={t('type')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectLabel>{t('type')}</SelectLabel>
                                                <SelectItem value="all">{t('all')}</SelectItem>
                                                <SelectItem value="general">{t('general')}</SelectItem>
                                                <SelectItem value="support">{t('support')}</SelectItem>
                                                <SelectItem value="sales">{t('feedback')}</SelectItem>
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                                        <SelectTrigger className="w-full sm:w-[160px]">
                                            <SelectValue placeholder={t('priority')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectLabel>{t('priority')}</SelectLabel>
                                                <SelectItem value="all">{t('all')}</SelectItem>
                                                <SelectItem value="high">{t('high')}</SelectItem>
                                                <SelectItem value="medium">{t('medium')}</SelectItem>
                                                <SelectItem value="low">{t('low')}</SelectItem>
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('name')}</TableHead>
                                    <TableHead>{t('subject')}</TableHead>
                                    <TableHead>{t('type')}</TableHead>
                                    <TableHead>{t('status')}</TableHead>
                                    <TableHead>{t('priority')}</TableHead>
                                    <TableHead>{t('date')}</TableHead>
                                    <TableHead className="w-[100px]">{t('actions')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-10">
                                            <div className="flex items-center justify-center">
                                                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                                                <span>{t('common:loading')}</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredMessages.length > 0 ? (
                                    filteredMessages.map((message:any) => (
                                        <TableRow key={message.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => {
                                            setSelectedMessage(message)
                                            setDetailsModalOpen(true)
                                        }}>
                                            <TableCell>
                                                <div className="flex items-center space-x-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                                                            {getInitials(message.name)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium">{message.name}</p>
                                                        <p className="text-sm text-muted-foreground">{message.email}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>{message.subject}</TableCell>
                                            <TableCell>{getTypeBadge(message.type)}</TableCell>
                                            <TableCell>{getStatusBadge(message.status)}</TableCell>
                                            <TableCell>{getPriorityBadge(message.priority)}</TableCell>
                                            <TableCell>
                                                <div>
                                                    <p className="text-sm">{new Date(message.createdAt).toLocaleDateString()}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(message.createdAt).toLocaleTimeString()}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                setSelectedMessage(message)
                                                                setReplyModalOpen(true)
                                                            }}
                                                        >
                                                            <Mail className="mr-2 h-4 w-4" />
                                                            {t('reply')}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                setSelectedMessage(message)
                                                                setDetailsModalOpen(true)
                                                            }}
                                                        >
                                                            <FileText className="mr-2 h-4 w-4" />
                                                            {t('viewDetails')}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />

                                                        {message.status !== 'resolved' && (
                                                            <DropdownMenuItem
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    handleStatusChange(message.id, 'resolved')
                                                                }}
                                                                className="text-green-600"
                                                            >
                                                                <CheckCircle className="mr-2 h-4 w-4" />
                                                                {t('markAsResolved')}
                                                            </DropdownMenuItem>
                                                        )}

                                                        {message.status === 'pending' && (
                                                            <DropdownMenuItem
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    handleStatusChange(message.id, 'in_progress')
                                                                }}
                                                                className="text-blue-600"
                                                            >
                                                                <MessageSquare className="mr-2 h-4 w-4" />
                                                                {t('markAsInProgress')}
                                                            </DropdownMenuItem>
                                                        )}

                                                        <DropdownMenuSeparator />

                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger className="flex items-center w-full px-2 py-1.5 text-sm">
                                                                <Tag className="mr-2 h-4 w-4" />
                                                                {t('priority')}
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent>
                                                                <DropdownMenuItem
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        handlePriorityChange(message.id, 'high')
                                                                    }}
                                                                    className="text-red-600"
                                                                >
                                                                    <AlertCircle className="mr-2 h-4 w-4" />
                                                                    {t('high')}
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        handlePriorityChange(message.id, 'medium')
                                                                    }}
                                                                    className="text-yellow-600"
                                                                >
                                                                    <ArrowUpDown className="mr-2 h-4 w-4" />
                                                                    {t('medium')}
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        handlePriorityChange(message.id, 'low')
                                                                    }}
                                                                    className="text-green-600"
                                                                >
                                                                    <ChevronRight className="mr-2 h-4 w-4" />
                                                                    {t('low')}
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>

                                                        <DropdownMenuSeparator />

                                                        <DropdownMenuItem
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleDeleteContact(message.id)
                                                            }}
                                                            className="text-red-600"
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                                {t('delete')}
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-10">
                                            <div className="flex flex-col items-center justify-center text-muted-foreground">
                                                <Search className="h-10 w-10 mb-2" />
                                                <p className="text-lg font-medium">{t('common:noResults')}</p>
                                                <p className="text-sm">{t('common:adjustFilters')}</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </Card>
                </div>
            </div>

            {/* Reply Modal */}
            <Dialog open={replyModalOpen} onOpenChange={setReplyModalOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>{t('replyToMessage')}</DialogTitle>
                    </DialogHeader>

                    {selectedMessage && (
                        <div className="space-y-6">
                            <div className="bg-muted/50 p-4 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center space-x-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                                                {getInitials(selectedMessage.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium">{selectedMessage.name}</p>
                                            <p className="text-sm text-muted-foreground">{selectedMessage.email}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-muted-foreground">
                                            {new Date(selectedMessage.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <p className="font-medium mb-1">{selectedMessage.subject}</p>
                                    <p className="text-sm">{selectedMessage.message}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>{t('yourReply')}</Label>
                                <Textarea
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="Type your reply here..."
                                    className="min-h-[150px]"
                                />
                            </div>

                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => setReplyModalOpen(false)}
                                >
                                    {t('cancel')}
                                </Button>
                                <Button
                                    onClick={handleReply}
                                    disabled={isSubmitting}
                                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            {t('common:sending')}
                                        </>
                                    ) : (
                                        <>
                                            <Send className="mr-2 h-4 w-4" />
                                            {t('send')}
                                        </>
                                    )}
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Details Modal */}
            <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{t('messageDetails')}</DialogTitle>
                        <DialogDescription>
                            {t('common:detailedInfo')}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedMessage && (
                        <div className="space-y-6">
                            {/* Customer Information */}
                            <Card>
                                <div className="p-4">
                                    <h3 className="text-lg font-medium mb-4">{t('contactInfo')}</h3>
                                    <div className="flex items-start space-x-4">
                                        <Avatar className="h-12 w-12">
                                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-lg">
                                                {getInitials(selectedMessage.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="space-y-1 flex-1">
                                            <div className="flex justify-between items-start">
                                                <p className="font-medium text-lg">{selectedMessage.name}</p>
                                                <div className="flex space-x-2">
                                                    {getStatusBadge(selectedMessage.status)}
                                                    {getPriorityBadge(selectedMessage.priority)}
                                                </div>
                                            </div>
                                            <p className="text-muted-foreground flex items-center">
                                                <Mail className="mr-2 h-4 w-4" />
                                                {selectedMessage.email}
                                            </p>
                                            <div className="flex items-center text-sm text-muted-foreground">
                                                <Calendar className="mr-2 h-4 w-4" />
                                                Submitted on {new Date(selectedMessage.createdAt).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* Message Content */}
                            <Card>
                                <div className="p-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-medium">{t('message')}</h3>
                                        {getTypeBadge(selectedMessage.type)}
                                    </div>
                                    <div className="space-y-2">
                                        <p className="font-medium">{selectedMessage.subject}</p>
                                        <p className="text-sm whitespace-pre-line">{selectedMessage.message}</p>
                                    </div>
                                </div>
                            </Card>

                            {/* Message History */}
                            <Card>
                                <div className="p-4">
                                    <h3 className="text-lg font-medium mb-4">{t('replyHistory')}</h3>
                                    <div className="space-y-4">
                                        {selectedMessage.history?.map((event: any, index: number) => (
                                            <div key={index} className="flex items-start space-x-3">
                                                <div className="mt-0.5">
                                                    {event.action === 'message_created' && <MessageSquare className="h-5 w-5 text-blue-500" />}
                                                    {event.action === 'status_changed' && <ArrowUpDown className="h-5 w-5 text-yellow-500" />}
                                                    {event.action === 'reply_sent' && <Send className="h-5 w-5 text-green-500" />}
                                                    {event.action === 'staff_assigned' && <User className="h-5 w-5 text-purple-500" />}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between">
                                                        <p className="font-medium text-sm">
                                                            {event.action.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {new Date(event.date).toLocaleString()}
                                                        </p>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">{event.details}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </Card>

                            {/* Previous Replies (if any) */}
                            {selectedMessage.replies && selectedMessage.replies.length > 0 && (
                                <Card>
                                    <div className="p-4">
                                        <h3 className="text-lg font-medium mb-4">{t('replyHistory')}</h3>
                                        <div className="space-y-4">
                                            {selectedMessage.replies.map((reply: any) => (
                                                <div key={reply.id} className="bg-blue-50 rounded-lg p-4">
                                                    <div className="flex justify-between mb-2">
                                                        <p className="font-medium">{reply.staff}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {new Date(reply.date).toLocaleString()}
                                                        </p>
                                                    </div>
                                                    <p className="text-sm whitespace-pre-line">{reply.content}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </Card>
                            )}

                            {/* Actions */}
                            <DialogFooter className="gap-2 flex-wrap">
                                {selectedMessage.status !== 'resolved' && (
                                    <Button
                                        variant="outline"
                                        className="border-green-500 text-green-600 hover:bg-green-50"
                                        onClick={() => {
                                            handleStatusChange(selectedMessage.id, 'resolved');
                                            setDetailsModalOpen(false);
                                        }}
                                    >
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        {t('markAsResolved')}
                                    </Button>
                                )}
                                {selectedMessage.status === 'pending' && (
                                    <Button
                                        variant="outline"
                                        className="border-blue-500 text-blue-600 hover:bg-blue-50"
                                        onClick={() => {
                                            handleStatusChange(selectedMessage.id, 'in_progress');
                                            setDetailsModalOpen(false);
                                        }}
                                    >
                                        <MessageSquare className="mr-2 h-4 w-4" />
                                        {t('markAsInProgress')}
                                    </Button>
                                )}
                                <Button
                                    onClick={() => {
                                        setDetailsModalOpen(false);
                                        setReplyModalOpen(true);
                                    }}
                                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                                >
                                    <Send className="mr-2 h-4 w-4" />
                                    {t('reply')}
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}