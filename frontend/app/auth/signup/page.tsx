"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { useTranslation } from 'react-i18next';
import '@/i18n';
import { toast } from "sonner";
import {
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
  Building,
  ArrowRight,
  ChevronRight,
  Sun,
  Moon,
  Laptop,
  LucideSparkles,
  Check,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTheme } from "next-themes";

// Import auth store and types
import { useAuthStore, SignupData } from "@/store";
import VerificationModal from "@/components/VerificationModal";

// Define types for the form data
interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  password: string;
  confirmPassword: string;
  gouvernorat: string;
  postalCode: string;
}

// Define types for form errors
interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  password?: string;
  confirmPassword?: string;
  gouvernorat?: string;
  postalCode?: string;
}

// Define types for password criteria
interface PasswordCriteria {
  length: boolean;
  uppercase: boolean;
  number: boolean;
  special: boolean;
}

const gouvernorats = [
  "Tunis",
  "Ariana",
  "Ben Arous",
  "Manouba",
  "Nabeul",
  "Zaghouan",
  "Bizerte",
  "Béja",
  "Jendouba",
  "Kef",
  "Siliana",
  "Sousse",
  "Monastir",
  "Mahdia",
  "Sfax",
  "Kairouan",
  "Kasserine",
  "Sidi Bouzid",
  "Gabès",
  "Medenine",
  "Tataouine",
  "Gafsa",
  "Tozeur",
  "Kebili",
];

export default function SignUpPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation(['auth']);
  const [step, setStep] = useState<number>(1);
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "+216", // Initialize with +216 prefix
    address: "",
    password: "",
    confirmPassword: "",
    gouvernorat: "",
    postalCode: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [passwordStrength, setPasswordStrength] = useState<number>(0);
  const [mounted, setMounted] = useState<boolean>(false);
  const [passwordCriteria, setPasswordCriteria] = useState<PasswordCriteria>({
    length: false,
    uppercase: false,
    number: false,
    special: false,
  });

  // Get signup function and error from auth store
  const { signup, error: authError, isLoading: authLoading, clearError } = useAuthStore();

  // Theme toggle workaround for hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Validate password in real-time
  useEffect(() => {
    if (formData.password) {
      validatePassword(formData.password);
    } else {
      setPasswordCriteria({
        length: false,
        uppercase: false,
        number: false,
        special: false,
      });
    }
  }, [formData.password]);

  // Show auth error in toast if it exists
  useEffect(() => {
    if (authError) {
      toast.error(authError);
      clearError();
    }
  }, [authError, clearError]);

  // Function to validate password and update criteria
  const validatePassword = (password: string): number => {
    const criteria = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    };

    setPasswordCriteria(criteria);
    const strengthScore = Object.values(criteria).filter(Boolean).length;
    setPasswordStrength(strengthScore);
    return strengthScore;
  };

  const validateStep = (stepNumber: number): boolean => {
    const newErrors: FormErrors = {};

    if (stepNumber === 1) {
      if (!formData.firstName.trim())
        newErrors.firstName = t('auth:signup.errors.requiredField');
      if (!formData.lastName.trim())
        newErrors.lastName = t('auth:signup.errors.requiredField');
      if (!formData.email.trim()) {
        newErrors.email = t('auth:signup.errors.requiredField');
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = t('auth:signup.errors.invalidEmail');
      }
      if (!formData.phone.trim() || formData.phone === "+216") {
        newErrors.phone = t('auth:signup.errors.requiredField');
      } else if (!/^\+216[2579][0-9]{7}$/.test(formData.phone)) {
        newErrors.phone = t('auth:signup.errors.invalidPhone');
      }
    }

    if (stepNumber === 2) {
      if (!formData.address.trim()) newErrors.address = t('auth:signup.errors.requiredField');
      if (!formData.gouvernorat) newErrors.gouvernorat = t('auth:signup.errors.requiredField');
      if (!formData.postalCode.trim()) newErrors.postalCode = t('auth:signup.errors.requiredField');
      else if (!/^\d{4}$/.test(formData.postalCode)) {
        newErrors.postalCode = t('auth:signup.errors.invalidPostalCode', 'Postal code must be 4 digits');
      }
    }

    if (stepNumber === 3) {
      if (!formData.password) {
        newErrors.password = t('auth:signup.errors.requiredField');
      } else if (formData.password.length < 8) {
        newErrors.password = t('auth:signup.passwordCriteria.length');
      } else if (
          !passwordCriteria.uppercase ||
          !passwordCriteria.number ||
          !passwordCriteria.special
      ) {
        newErrors.password = t('auth:signup.errors.weakPassword');
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = t('auth:signup.errors.requiredField');
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = t('auth:signup.errors.passwordMismatch');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const [showVerificationModal, setShowVerificationModal] = useState<boolean>(false);
  const [verificationEmail, setVerificationEmail] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateStep(3)) {
      return;
    }

    setLoading(true);
    try {
      const signupData: SignupData = {
        nom: formData.lastName,
        prenom: formData.firstName,
        email: formData.email,
        telephone: formData.phone,
        ville: formData.address,
        codePostal: formData.postalCode,
        gouvernorat: formData.gouvernorat,
        motDePasse: formData.password,
      };

      await signup(signupData);

      const storeState = useAuthStore.getState();

      if (storeState.verificationEmailSent && storeState.verificationEmail) {
        setVerificationEmail(storeState.verificationEmail);
        setShowVerificationModal(true);
      } else {
        toast.success(t('auth:signup.success'));
        router.push("/auth/signin");
      }
    } catch (error: any) {
      // Error is handled by the auth store and displayed via useEffect
      console.error("Signup error:", error);
      toast.error(error.message || t('auth:signup.errors.serverError'));
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    } else {
      toast.error(t('auth:signup.errors.requiredField'));
    }
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const getStrengthColor = (strength: number): string => {
    const colors = [
      "bg-red-500",
      "bg-red-500",
      "bg-orange-500",
      "bg-yellow-500",
      "bg-green-500",
    ];
    return strength > 0 ? colors[strength] : "bg-gray-200 dark:bg-gray-700";
  };

  // Handle phone number input to prevent modifying the +216 prefix
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    // Ensure the input starts with +216
    if (!value.startsWith("+216")) {
      value = "+216" + value.replace(/^\+216/, "");
    }
    // Remove any non-digit characters after +216 and limit to 8 digits
    const digits = value.replace("+216", "").replace(/\D/g, "").slice(0, 8);
    setFormData({
      ...formData,
      phone: "+216" + digits,
    });
  };

  return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50 p-4 transition-colors duration-300 dark:from-blue-950 dark:to-purple-950">
        {/* Tech-themed animated background (unchanged) */}
        <div className="absolute inset-0 overflow-hidden opacity-50 dark:opacity-30">
          <svg
              className="absolute left-0 top-0 size-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
          >
            <pattern
                id="circuit-pattern"
                x="0"
                y="0"
                width="10"
                height="10"
                patternUnits="userSpaceOnUse"
            >
              <path
                  d="M 10 0 L 7 0 L 7 7 L 0 7 L 0 10 L 10 10 Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.2"
                  className="text-blue-300 dark:text-blue-700"
              />
            </pattern>
            <rect x="0" y="0" width="100" height="100" fill="url(#circuit-pattern)" />
          </svg>
          <div className="absolute left-10 top-10">
            <motion.div
                animate={{ y: [0, 15, 0], opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="size-12 rounded-lg border border-blue-200 bg-blue-100/50 backdrop-blur-sm dark:border-blue-800 dark:bg-blue-900/30"
            />
          </div>
          <div className="absolute right-20 top-20">
            <motion.div
                animate={{ y: [0, -20, 0], opacity: [0.5, 0.9, 0.5] }}
                transition={{
                  duration: 10,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1,
                }}
                className="size-16 rounded-full border border-purple-200 bg-purple-100/50 backdrop-blur-sm dark:border-purple-800 dark:bg-purple-900/30"
            />
          </div>
          <div className="absolute bottom-20 left-1/4">
            <motion.div
                animate={{ x: [0, 20, 0], opacity: [0.6, 1, 0.6] }}
                transition={{
                  duration: 12,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 2,
                }}
                className="h-8 w-20 rounded-lg border border-indigo-200 bg-indigo-100/50 backdrop-blur-sm dark:border-indigo-800 dark:bg-indigo-900/30"
            />
          </div>
          <div className="absolute bottom-40 right-1/4">
            <motion.div
                animate={{ x: [0, -15, 0], opacity: [0.7, 1, 0.7] }}
                transition={{
                  duration: 9,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 3,
                }}
                className="size-10 rounded-lg border border-cyan-200 bg-cyan-100/50 backdrop-blur-sm dark:border-cyan-800 dark:bg-cyan-900/30"
            />
          </div>
          <div className="absolute inset-0 grid grid-cols-12 grid-rows-6 gap-8 p-8">
            {Array.from({ length: 72 }).map((_, i) => (
                <motion.div
                    key={i}
                    className="size-1 rounded-full bg-blue-400/30 dark:bg-blue-500/30"
                    animate={{
                      scale: [1, Math.random() * 0.5 + 1.5, 1],
                      opacity: [0.3, Math.random() * 0.3 + 0.7, 0.3],
                    }}
                    transition={{
                      duration: Math.random() * 2 + 3,
                      repeat: Infinity,
                      delay: Math.random() * 5,
                    }}
                />
            ))}
          </div>
          <motion.div
              className="absolute bottom-0 left-0 h-40 w-full opacity-10"
              animate={{ opacity: [0.05, 0.1, 0.05] }}
              transition={{ duration: 5, repeat: Infinity }}
          >
            {Array.from({ length: 10 }).map((_, i) => (
                <div
                    key={i}
                    className="h-px bg-gradient-to-r from-blue-400 via-purple-400 to-transparent"
                    style={{
                      marginTop: `${i * 4}px`,
                      width: `${Math.random() * 50 + 50}%`,
                    }}
                />
            ))}
          </motion.div>
          <div className="absolute left-1/4 top-1/4 font-mono text-xs text-blue-500/20 dark:text-blue-400/20">
            <motion.div
                animate={{ opacity: [0.1, 0.2, 0.1] }}
                transition={{ duration: 8, repeat: Infinity }}
            >
              10100111
              <br />
              01010001
              <br />
              11010110
            </motion.div>
          </div>
          <div className="absolute right-1/4 top-2/3 font-mono text-xs text-purple-500/20 dark:text-purple-400/20">
            <motion.div
                animate={{ opacity: [0.1, 0.2, 0.1] }}
                transition={{ duration: 10, repeat: Infinity, delay: 2 }}
            >
              01010111
              <br />
              10101100
              <br />
              01011011
            </motion.div>
          </div>
        </div>

        <div className="pointer-events-none absolute z-0">
          <motion.div
              className="size-96 rounded-full bg-gradient-to-r from-blue-400/20 to-purple-400/20 blur-3xl dark:from-blue-400/10 dark:to-purple-400/10"
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, 0],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
          />
        </div>

        <div className="z-10 w-full max-w-md">
          <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="relative mb-6 text-center"
          >
            <div className="mb-1 flex items-center justify-center">
              <LucideSparkles className="mr-1 size-5 text-blue-600 dark:text-blue-400" />
              <h1 className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-3xl font-bold text-transparent dark:from-blue-400 dark:to-purple-400">
                TechVerse
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('auth:signup.description', 'Join our universe of technology')}
            </p>
          </motion.div>

          <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="border border-gray-200/50 bg-white/90 shadow-xl backdrop-blur-xl dark:border-gray-800/50 dark:bg-gray-900/90">
              <CardHeader className="relative pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-medium">{t('auth:signup.title', 'Sign Up')}</CardTitle>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="relative">
                          <div
                              className={`h-2 w-8 rounded-full ${
                                  i < step
                                      ? "bg-green-500 dark:bg-green-600"
                                      : i === step
                                          ? "bg-blue-600 dark:bg-blue-500"
                                          : "bg-gray-200 dark:bg-gray-700"
                              }`}
                          />
                          {i === step && (
                              <motion.div
                                  className="absolute inset-0 rounded-full bg-blue-400 opacity-50 dark:bg-blue-400"
                                  animate={{ scale: [1, 1.2, 1] }}
                                  transition={{ duration: 1.5, repeat: Infinity }}
                              />
                          )}
                        </div>
                    ))}
                  </div>
                </div>
                <CardDescription className="text-xs">
                  {step === 1 && t('auth:signup.step1', 'Step 1: Personal Information')}
                  {step === 2 && t('auth:signup.step2', 'Step 2: Location Details')}
                  {step === 3 && t('auth:signup.step3', 'Step 3: Secure Your Account')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-4"
                        >
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label
                                  htmlFor="firstName"
                                  className="flex items-center text-xs font-medium"
                              >
                                {t('auth:signup.firstNameLabel', 'First Name')}
                                <span className="ml-1 text-red-500">*</span>
                              </Label>
                              <div className="relative">
                                <User className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                                <Input
                                    id="firstName"
                                    placeholder={t('auth:signup.firstNamePlaceholder', 'John')}
                                    value={formData.firstName}
                                    onChange={(e) =>
                                        setFormData({
                                          ...formData,
                                          firstName: e.target.value,
                                        })
                                    }
                                    className={`h-9 pl-8 text-sm ${errors.firstName ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                                    required
                                />
                              </div>
                              {errors.firstName && (
                                  <p className="mt-1 text-xs text-red-500">
                                    {errors.firstName}
                                  </p>
                              )}
                            </div>
                            <div className="space-y-1.5">
                              <Label
                                  htmlFor="lastName"
                                  className="flex items-center text-xs font-medium"
                              >
                                {t('auth:signup.lastNameLabel', 'Last Name')}
                                <span className="ml-1 text-red-500">*</span>
                              </Label>
                              <div className="relative">
                                <User className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                                <Input
                                    id="lastName"
                                    placeholder={t('auth:signup.lastNamePlaceholder', 'Doe')}
                                    value={formData.lastName}
                                    onChange={(e) =>
                                        setFormData({
                                          ...formData,
                                          lastName: e.target.value,
                                        })
                                    }
                                    className={`h-9 pl-8 text-sm ${errors.lastName ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                                    required
                                />
                              </div>
                              {errors.lastName && (
                                  <p className="mt-1 text-xs text-red-500">
                                    {errors.lastName}
                                  </p>
                              )}
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <Label
                                htmlFor="email"
                                className="flex items-center text-xs font-medium"
                            >
                              {t('auth:signup.emailLabel', 'Email')}
                              <span className="ml-1 text-red-500">*</span>
                            </Label>
                            <div className="relative">
                              <Mail className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                              <Input
                                  id="email"
                                  type="email"
                                  placeholder={t('auth:signup.emailPlaceholder', 'johndoe@example.com')}
                                  value={formData.email}
                                  onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        email: e.target.value,
                                      })
                                  }
                                  className={`h-9 pl-8 text-sm ${errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                                  required
                              />
                            </div>
                            {errors.email && (
                                <p className="mt-1 text-xs text-red-500">
                                  {errors.email}
                                </p>
                            )}
                          </div>

                          <div className="space-y-1.5">
                            <Label
                                htmlFor="phone"
                                className="flex items-center text-xs font-medium"
                            >
                              {t('auth:signup.phoneLabel', 'Phone Number')}
                              <span className="ml-1 text-red-500">*</span>
                            </Label>
                            <div className="relative flex items-center">
                              <div className="absolute left-2.5 top-2 flex items-center">
                                <Phone className="size-3.5 text-muted-foreground" />
                                <span className="ml-2  text-sm text-muted-foreground">+216</span>
                              </div>
                              <Input
                                  id="phone"
                                  type="tel"
                                  placeholder="98 123 456"
                                  value={formData.phone.replace("+216", "")}
                                  onChange={handlePhoneChange}
                                  className={`h-9 pl-20 text-sm ${errors.phone ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                                  required
                              />
                            </div>
                            {errors.phone && (
                                <p className="mt-1 text-xs text-red-500">
                                  {errors.phone}
                                </p>
                            )}
                          </div>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-4"
                        >
                          <div className="space-y-1.5">
                            <Label
                                htmlFor="address"
                                className="flex items-center text-xs font-medium"
                            >
                              Address
                              <span className="ml-1 text-red-500">*</span>
                            </Label>
                            <div className="relative">
                              <MapPin className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                              <Input
                                  id="address"
                                  placeholder="123 Main St, Apt 4B"
                                  value={formData.address}
                                  onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        address: e.target.value,
                                      })
                                  }
                                  className={`h-9 pl-8 text-sm ${errors.address ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                                  required
                              />
                            </div>
                            {errors.address && (
                                <p className="mt-1 text-xs text-red-500">
                                  {errors.address}
                                </p>
                            )}
                          </div>

                          <div className="space-y-1.5">
                            <Label
                                htmlFor="postalCode"
                                className="flex items-center text-xs font-medium"
                            >
                              Postal Code
                              <span className="ml-1 text-red-500">*</span>
                            </Label>
                            <div className="relative">
                              <MapPin className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                              <Input
                                  id="postalCode"
                                  placeholder="1234"
                                  value={formData.postalCode}
                                  onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        postalCode: e.target.value,
                                      })
                                  }
                                  className={`h-9 pl-8 text-sm ${errors.postalCode ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                                  required
                              />
                            </div>
                            {errors.postalCode && (
                                <p className="mt-1 text-xs text-red-500">
                                  {errors.postalCode}
                                </p>
                            )}
                          </div>

                          <div className="space-y-1.5">
                            <Label
                                htmlFor="gouvernorat"
                                className="flex items-center text-xs font-medium"
                            >
                              Gouvernorat
                              <span className="ml-1 text-red-500">*</span>
                            </Label>
                            <div className="relative">
                              <Building className="absolute left-2.5 top-2.5 z-10 size-3.5 text-muted-foreground" />
                              <Select
                                  value={formData.gouvernorat}
                                  onValueChange={(value) =>
                                      setFormData({ ...formData, gouvernorat: value })
                                  }
                              >
                                <SelectTrigger
                                    className={`h-9 w-full pl-8 text-sm ${errors.gouvernorat ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                                >
                                  <SelectValue placeholder="Select region" />
                                </SelectTrigger>
                                <SelectContent>
                                  {gouvernorats.map((gov) => (
                                      <SelectItem
                                          key={gov}
                                          value={gov.toLowerCase()}
                                          className="text-sm"
                                      >
                                        {gov}
                                      </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            {errors.gouvernorat && (
                                <p className="mt-1 text-xs text-red-500">
                                  {errors.gouvernorat}
                                </p>
                            )}
                          </div>

                          <div className="mt-4 rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                            <p className="text-xs text-blue-700 dark:text-blue-300">
                              All products will be delivered to this address. Please
                              ensure it's accurate.
                            </p>
                          </div>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-4"
                        >
                          <div className="space-y-1.5">
                            <Label
                                htmlFor="password"
                                className="flex items-center text-xs font-medium"
                            >
                              Password
                              <span className="ml-1 text-red-500">*</span>
                            </Label>
                            <div className="relative">
                              <Lock className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                              <Input
                                  id="password"
                                  type="password"
                                  placeholder="••••••••"
                                  value={formData.password}
                                  onChange={(e) => {
                                    setFormData({
                                      ...formData,
                                      password: e.target.value,
                                    });
                                  }}
                                  className={`h-9 pl-8 text-sm ${errors.password ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                                  required
                              />
                            </div>
                            {errors.password ? (
                                <p className="mt-1 text-xs text-red-500">
                                  {errors.password}
                                </p>
                            ) : (
                                <>
                                  <div className="mt-1.5">
                                    <div className="mb-1 flex space-x-1">
                                      {[...Array(4)].map((_, i) => (
                                          <div
                                              key={i}
                                              className={`h-1 flex-1 rounded-full ${
                                                  i < passwordStrength
                                                      ? getStrengthColor(passwordStrength)
                                                      : "bg-gray-200 dark:bg-gray-700"
                                              }`}
                                          />
                                      ))}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                      {passwordStrength === 0 &&
                                          formData.password &&
                                          "Very weak"}
                                      {passwordStrength === 1 && "Weak"}
                                      {passwordStrength === 2 && "Medium"}
                                      {passwordStrength === 3 && "Strong"}
                                      {passwordStrength === 4 && "Very strong"}
                                    </p>
                                  </div>
                                  <div className="mt-2 space-y-1.5">
                                    <div className="flex items-center gap-1.5">
                                      {passwordCriteria.length ? (
                                          <Check className="size-3 text-green-500" />
                                      ) : (
                                          <X className="size-3 text-muted-foreground" />
                                      )}
                                      <span
                                          className={`text-xs ${passwordCriteria.length ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}
                                      >
                                  At least 8 characters
                                </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      {passwordCriteria.uppercase ? (
                                          <Check className="size-3 text-green-500" />
                                      ) : (
                                          <X className="size-3 text-muted-foreground" />
                                      )}
                                      <span
                                          className={`text-xs ${passwordCriteria.uppercase ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}
                                      >
                                  At least one uppercase letter
                                </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      {passwordCriteria.number ? (
                                          <Check className="size-3 text-green-500" />
                                      ) : (
                                          <X className="size-3 text-muted-foreground" />
                                      )}
                                      <span
                                          className={`text-xs ${passwordCriteria.number ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}
                                      >
                                  At least one number
                                </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      {passwordCriteria.special ? (
                                          <Check className="size-3 text-green-500" />
                                      ) : (
                                          <X className="size-3 text-muted-foreground" />
                                      )}
                                      <span
                                          className={`text-xs ${passwordCriteria.special ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}
                                      >
                                  At least one special character
                                </span>
                                    </div>
                                  </div>
                                </>
                            )}
                          </div>

                          <div className="space-y-1.5">
                            <Label
                                htmlFor="confirmPassword"
                                className="flex items-center text-xs font-medium"
                            >
                              Confirm Password
                              <span className="ml-1 text-red-500">*</span>
                            </Label>
                            <div className="relative">
                              <Lock className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                              <Input
                                  id="confirmPassword"
                                  type="password"
                                  placeholder="••••••••"
                                  value={formData.confirmPassword}
                                  onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        confirmPassword: e.target.value,
                                      })
                                  }
                                  className={`h-9 pl-8 text-sm ${errors.confirmPassword ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                                  required
                              />
                            </div>
                            {errors.confirmPassword && (
                                <p className="mt-1 text-xs text-red-500">
                                  {errors.confirmPassword}
                                </p>
                            )}
                            {formData.confirmPassword &&
                                formData.password &&
                                !errors.confirmPassword && (
                                    <div className="mt-1.5 flex items-center gap-1.5">
                                      <Check className="size-3 text-green-500" />
                                      <span className="text-xs text-green-600 dark:text-green-400">
                                Passwords match
                              </span>
                                    </div>
                                )}
                          </div>
                        </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex items-center justify-between pt-2">
                    {step > 1 ? (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={prevStep}
                            className="h-8 text-xs"
                        >
                          Back
                        </Button>
                    ) : (
                        <div></div>
                    )}

                    {step < 3 ? (
                        <Button
                            type="button"
                            onClick={nextStep}
                            size="sm"
                            className="h-8 bg-gradient-to-r from-blue-600 to-purple-600 text-xs hover:opacity-90 dark:from-blue-500 dark:to-purple-500"
                        >
                          {t('auth:signup.nextStep', 'Continue')}
                          <ChevronRight className="ml-1 size-3" />
                        </Button>
                    ) : (
                        <Button
                            type="submit"
                            className="h-8 bg-gradient-to-r from-blue-600 to-purple-600 text-xs hover:opacity-90 dark:from-blue-500 dark:to-purple-500"
                            disabled={
                                loading ||
                                !passwordCriteria.length ||
                                !passwordCriteria.uppercase ||
                                !passwordCriteria.number ||
                                !passwordCriteria.special ||
                                formData.password !== formData.confirmPassword
                            }
                            size="sm"
                        >
                          {loading ? (
                              <span className="flex items-center">
                          <svg
                              className="-ml-1 mr-1 size-3 animate-spin text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                          >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            ></circle>
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          {t('auth:signup.creatingAccount', 'Creating Account...')}
                        </span>
                          ) : (
                              <span className="flex items-center">
                          {t('auth:signup.submitButton', 'Create Account')}
                          <ArrowRight className="ml-1 size-3" />
                        </span>
                          )}
                        </Button>
                    )}
                  </div>
                </form>
              </CardContent>
              <CardFooter className="flex flex-col space-y-2 px-6 pb-4 pt-0">
                <div className="text-center text-xs text-muted-foreground">
                  {t('auth:signup.hasAccount', 'Already have an account?')}{" "}
                  <Link
                      href="/auth/signin"
                      className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {t('auth:signup.signinLink', 'Sign in')}
                  </Link>
                </div>
                <p className="text-center text-xs text-muted-foreground">
                  By creating an account, you agree to our{" "}
                  <Link
                      href="/terms"
                      className="underline underline-offset-4 hover:text-primary"
                  >
                    Terms
                  </Link>{" "}
                  and{" "}
                  <Link
                      href="/privacy"
                      className="underline underline-offset-4 hover:text-primary"
                  >
                    Privacy Policy
                  </Link>
                </p>
              </CardFooter>
            </Card>
          </motion.div>
        </div>
        <VerificationModal
            isOpen={showVerificationModal}
            onClose={() => setShowVerificationModal(false)}
            email={verificationEmail}
        />
      </div>
  );
}