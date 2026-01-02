"use client";

import { useMemo, useState, useTransition } from "react";
import { Save, Loader2, Palette, Type, Monitor, Trash2, RotateCcw, Copy } from "lucide-react";
import { updateBranding } from "./actions";
import { toast } from "sonner";
import { LoginForm } from "@/app/auth/login/login-form";

interface BrandingSettings {
    locale?: string;
    logo?: string;
    invertLogo?: boolean;
    logoScale?: 1 | 0.75 | 0.5 | 0.25;
    primaryColor?: string;
    backgroundColor?: string;
    loginTitle?: string;
    loginSubtitle?: string;
    loginContainer?: {
        backgroundColor?: string;
        borderColor?: string;
    };
    footerTextEnabled?: boolean;
    footerText?: string;
    authCards?: {
        password?: {
            title?: string;
            subtitle?: string;
            backgroundColor?: string;
            borderColor?: string;
            hoverBackgroundColor?: string;
            hoverBorderColor?: string;
            hoverOverlayColor?: string;
            iconColor?: string;
            iconHoverColor?: string;
            iconBackgroundColor?: string;
            arrowColor?: string;
            arrowHoverColor?: string;
            colors?: {
                title?: string;
                subtitle?: string;
            };
        };
        emailOtp?: {
            title?: string;
            subtitle?: string;
            backgroundColor?: string;
            borderColor?: string;
            hoverBackgroundColor?: string;
            hoverBorderColor?: string;
            hoverOverlayColor?: string;
            iconColor?: string;
            iconHoverColor?: string;
            iconBackgroundColor?: string;
            arrowColor?: string;
            arrowHoverColor?: string;
            colors?: {
                title?: string;
                subtitle?: string;
            };
        };
        smsOtp?: {
            title?: string;
            subtitle?: string;
            backgroundColor?: string;
            borderColor?: string;
            hoverBackgroundColor?: string;
            hoverBorderColor?: string;
            hoverOverlayColor?: string;
            iconColor?: string;
            iconHoverColor?: string;
            iconBackgroundColor?: string;
            arrowColor?: string;
            arrowHoverColor?: string;
            colors?: {
                title?: string;
                subtitle?: string;
            };
        };
        wallet?: {
            title?: string;
            subtitle?: string;
            backgroundColor?: string;
            borderColor?: string;
            hoverBackgroundColor?: string;
            hoverBorderColor?: string;
            hoverOverlayColor?: string;
            iconColor?: string;
            iconHoverColor?: string;
            iconBackgroundColor?: string;
            arrowColor?: string;
            arrowHoverColor?: string;
            colors?: {
                title?: string;
                subtitle?: string;
            };
        };
    };
    colors?: {
        title?: string;
        subtitle?: string;
        footer?: string;
    };

    ui?: {
        locales?: Record<string, Record<string, string>>;
    };

    messages?: {
        // Legacy (non-localized)
        otpSent?: string;
        otpSendFailed?: string;
        verificationFailed?: string;
        loginFailed?: string;
        registrationFailed?: string;
        walletLoginFailed?: string;
        unexpectedError?: string;

        // Additional flows
        accountNotFoundTitle?: string;
        accountNotFoundBody?: string;
        accountAlreadyExists?: string;
        invalidSession?: string;

        // Wallet flow
        walletMissingExtension?: string;
        walletCouldNotGetAddress?: string;
        walletFailedToGetNonce?: string;
        walletSigningFailed?: string;
        walletFailedToLogin?: string;

        // i18n
        locales?: {
            en?: Record<string, string>;
            es?: Record<string, string>;
        };

        // Inline message styles
        styles?: {
            successTextColor?: string;
            successBackgroundColor?: string;
            successBorderColor?: string;
            errorTextColor?: string;
            errorBackgroundColor?: string;
            errorBorderColor?: string;
            infoTextColor?: string;
            infoBackgroundColor?: string;
            infoBorderColor?: string;
        };
    };
    designTokens?: {
        borderRadius?: string;
        glassBlur?: string;
    };

    controls?: {
        primaryButton?: {
            backgroundColor?: string;
            hoverBackgroundColor?: string;
            textColor?: string;
            hoverTextColor?: string;
            borderColor?: string;
            hoverBorderColor?: string;
            disabledBackgroundColor?: string;
            disabledTextColor?: string;
            disabledBorderColor?: string;
            labels?: {
                signIn?: string;
                sendCode?: string;
                createAccount?: string;
                createAccountNow?: string;
                verifyAndSignIn?: string;
            };
        };
        input?: {
            backgroundColor?: string;
            borderColor?: string;
            textColor?: string;
            placeholderColor?: string;
            hoverBackgroundColor?: string;
            hoverBorderColor?: string;
            focusBorderColor?: string;
            disabledBackgroundColor?: string;
            disabledBorderColor?: string;
            disabledTextColor?: string;
            errorBorderColor?: string;
        };
        select?: {
            triggerBackgroundColor?: string;
            triggerHoverBackgroundColor?: string;
            triggerBorderColor?: string;
            triggerTextColor?: string;
            menuBackgroundColor?: string;
            menuBorderColor?: string;
            itemHoverBackgroundColor?: string;
            itemActiveBackgroundColor?: string;
            itemTextColor?: string;
            itemSubtextColor?: string;
        };

        secondaryLink?: {
            textColor?: string;
            hoverTextColor?: string;
        };

        loading?: {
            spinnerColor?: string;
            spinnerOnPrimaryColor?: string;
            backgroundColor?: string;
            borderColor?: string;
        };
    };
}

export default function BrandingEditor({ type, id, initialBranding, name }: {
    type: 'tenant' | 'application',
    id: string,
    initialBranding: BrandingSettings,
    name: string
}) {
    const toColorInputValue = (value: string | undefined, fallback: string) => {
        if (!value) return fallback;
        const v = value.trim();

        const hex3 = /^#([0-9a-fA-F]{3})$/;
        const hex4 = /^#([0-9a-fA-F]{4})$/;
        const hex6 = /^#([0-9a-fA-F]{6})$/;
        const hex8 = /^#([0-9a-fA-F]{8})$/;

        let m = v.match(hex3);
        if (m) {
            const h = m[1];
            return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`;
        }

        m = v.match(hex4);
        if (m) {
            const h = m[1];
            return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`;
        }

        m = v.match(hex6);
        if (m) return `#${m[1]}`;

        m = v.match(hex8);
        if (m) return `#${m[1].slice(0, 6)}`;

        return fallback;
    };

    const toHex6 = (value: string | undefined, fallback: string) => {
        const v = (value || '').trim();

        const hex3 = /^#([0-9a-fA-F]{3})$/;
        const hex4 = /^#([0-9a-fA-F]{4})$/;
        const hex6 = /^#([0-9a-fA-F]{6})$/;
        const hex8 = /^#([0-9a-fA-F]{8})$/;

        let m = v.match(hex3);
        if (m) {
            const h = m[1];
            return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`;
        }

        m = v.match(hex4);
        if (m) {
            const h = m[1];
            return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`;
        }

        m = v.match(hex6);
        if (m) return `#${m[1]}`;

        m = v.match(hex8);
        if (m) return `#${m[1].slice(0, 6)}`;

        return fallback;
    };

    const AUTH_CARD_DEFS = [
        { key: 'password', label: 'Password' },
        { key: 'emailOtp', label: 'Email OTP' },
        { key: 'smsOtp', label: 'SMS OTP' },
        { key: 'wallet', label: 'Wallet' },
    ] as const;
    type AuthCardKey = typeof AUTH_CARD_DEFS[number]['key'];

    const getBaseDefaults = (): BrandingSettings => ({
        locale: 'en',
        primaryColor: '#d4af37',
        backgroundColor: '#0a0f1e',
        footerTextEnabled: false,
        footerText: '',
        logoScale: 1,
        loginContainer: {
            backgroundColor: '#0A192FCC',
            borderColor: '#FFFFFF1A',
        },
        controls: {
            primaryButton: {
                textColor: '#0A192F',
                hoverTextColor: '#0A192F',
                borderColor: 'transparent',
                hoverBackgroundColor: '#d4af37E6',
                labels: {
                    signIn: 'Sign In',
                    sendCode: 'Send Code',
                    createAccount: 'Create Account',
                    createAccountNow: 'Create Account Now',
                    verifyAndSignIn: 'Verify & Sign In',
                },
            },
            input: {
                backgroundColor: '#FFFFFF0D',
                borderColor: '#FFFFFF1A',
                textColor: '#ffffff',
                placeholderColor: '#94A3B880',
                hoverBackgroundColor: '#FFFFFF14',
                hoverBorderColor: '#FFFFFF2E',
                focusBorderColor: '#d4af37',
                disabledBackgroundColor: '#FFFFFF08',
                disabledBorderColor: '#FFFFFF14',
                disabledTextColor: '#94A3B8CC',
                errorBorderColor: '#ef4444',
            },
            select: {
                triggerBackgroundColor: '#FFFFFF0D',
                triggerHoverBackgroundColor: '#FFFFFF1A',
                triggerBorderColor: '#FFFFFF1A',
                triggerTextColor: '#ffffff',
                menuBackgroundColor: '#0A192FF2',
                menuBorderColor: '#FFFFFF1A',
                itemHoverBackgroundColor: '#FFFFFF1A',
                itemActiveBackgroundColor: '#d4af3720',
                itemTextColor: '#ffffff',
                itemSubtextColor: '#94A3B8',
            },
            secondaryLink: {
                textColor: '#94a3b8',
                hoverTextColor: '#ffffff',
            },
            loading: {
                spinnerColor: '#ffffff',
                spinnerOnPrimaryColor: '#0A192F',
                backgroundColor: '#0A192FCC',
                borderColor: '#FFFFFF1A',
            },
        },
        authCards: {
            password: {
                title: 'Password',
                subtitle: 'Standard credentials',
                backgroundColor: '#FFFFFF0D',
                borderColor: '#FFFFFF1A',
                hoverBackgroundColor: '#FFFFFF14',
                hoverBorderColor: '#FFFFFF2E',
                hoverOverlayColor: '#FFFFFF0D',
                arrowColor: '#94a3b8',
                colors: { title: '#ffffff', subtitle: '#94a3b8' },
            },
            emailOtp: {
                title: 'Email',
                subtitle: 'Email verification code',
                backgroundColor: '#FFFFFF0D',
                borderColor: '#FFFFFF1A',
                hoverBackgroundColor: '#FFFFFF14',
                hoverBorderColor: '#FFFFFF2E',
                hoverOverlayColor: '#FFFFFF0D',
                arrowColor: '#94a3b8',
                colors: { title: '#ffffff', subtitle: '#94a3b8' },
            },
            smsOtp: {
                title: 'SMS',
                subtitle: 'SMS verification code',
                backgroundColor: '#FFFFFF0D',
                borderColor: '#FFFFFF1A',
                hoverBackgroundColor: '#FFFFFF14',
                hoverBorderColor: '#FFFFFF2E',
                hoverOverlayColor: '#FFFFFF0D',
                arrowColor: '#94a3b8',
                colors: { title: '#ffffff', subtitle: '#94a3b8' },
            },
            wallet: {
                title: 'Wallet',
                subtitle: 'Stellar wallet signing',
                backgroundColor: '#FFFFFF0D',
                borderColor: '#FFFFFF1A',
                hoverBackgroundColor: '#FFFFFF14',
                hoverBorderColor: '#FFFFFF2E',
                hoverOverlayColor: '#FFFFFF0D',
                arrowColor: '#94a3b8',
                colors: { title: '#ffffff', subtitle: '#94a3b8' },
            },
        },
        colors: { title: '#ffffff', subtitle: '#94a3b8', footer: '#94a3b8' },
        ui: {
            locales: {
                en: {
                    loginTitle: 'Sign in to {clientName}',
                    loginSubtitle: 'Enter your credentials to continue',
                    signInToClient: 'Sign in to {clientName}',
                    poweredByZKey: 'Powered by ZKey',
                    signIn: 'Sign In',
                    sendCode: 'Send Code',
                    createAccount: 'Create Account',
                    createAccountNow: 'Create Account Now',
                    verifyAndSignIn: 'Verify & Sign In',
                    backToOptions: 'Back to options',
                    dontHaveAccount: "Don't have an account?",
                    signUp: 'Sign up',
                    alreadyHaveAccount: 'Already have an account? Sign in',
                    passwordSubtitle: 'Enter your email and password',
                    emailPlaceholder: 'name@example.com',
                    passwordPlaceholder: 'Password',
                    firstNamePlaceholder: 'First Name',
                    lastNamePlaceholder: 'Last Name',
                    phonePlaceholder: '600 000 000',
                    createAccountTitle: 'Create Account',
                    createAccountSubtitle: 'Join {clientName} today',
                    signInTitle: 'Sign In',
                    enterYourForClient: 'Enter your {method} for {clientName}',
                    methodPhone: 'phone',
                    methodEmail: 'email',
                    tryDifferentEmail: 'Try a different email',
                    tryDifferentNumber: 'Try a different number',
                    stellarWalletTitle: 'Stellar Wallet',
                    stellarWalletSubtitle: 'Sign in to {clientName} securely',
                    enterCodeTitle: 'Enter Code',
                    codeSentTo: 'We sent a 6-digit code to {identifier}',
                    codeExpiresIn: 'Code expires in {time}',
                    codeExpired: 'Code expired',
                    otpPlaceholder: '000000',
                    resend: "Didn't receive code? Resend",
                    changeEmail: 'Change email',
                    changeNumber: 'Change number',
                    loginWithWallet: 'Login with Stellar Wallet',

                    otpDeliveryPreference: 'Choose where you want to receive your confirmation code.',
                    otpDeliverySingle: "We'll send your confirmation code via {channel}.",
                    authPasswordTitle: 'Password',
                    authPasswordSubtitle: 'Standard credentials',
                    authEmailTitle: 'Email',
                    authEmailSubtitle: 'Email verification code',
                    authSmsTitle: 'SMS',
                    authSmsSubtitle: 'SMS verification code',
                    authWalletTitle: 'Wallet',
                    authWalletSubtitle: 'Stellar wallet signing',
                },
                es: {
                    loginTitle: 'Inicia sesión en {clientName}',
                    loginSubtitle: 'Ingresa tus credenciales para continuar',
                    signInToClient: 'Inicia sesión en {clientName}',
                    poweredByZKey: 'Con tecnología de ZKey',
                    signIn: 'Iniciar sesión',
                    sendCode: 'Enviar código',
                    createAccount: 'Crear cuenta',
                    createAccountNow: 'Crear cuenta ahora',
                    verifyAndSignIn: 'Verificar e iniciar',
                    backToOptions: 'Volver a opciones',
                    dontHaveAccount: '¿No tienes cuenta?',
                    signUp: 'Regístrate',
                    alreadyHaveAccount: '¿Ya tienes cuenta? Inicia sesión',
                    passwordSubtitle: 'Ingresa tu email y contraseña',
                    emailPlaceholder: 'nombre@ejemplo.com',
                    passwordPlaceholder: 'Contraseña',
                    firstNamePlaceholder: 'Nombre',
                    lastNamePlaceholder: 'Apellidos',
                    phonePlaceholder: '600 000 000',
                    createAccountTitle: 'Crear cuenta',
                    createAccountSubtitle: 'Únete a {clientName} hoy',
                    signInTitle: 'Iniciar sesión',
                    enterYourForClient: 'Ingresa tu {method} para {clientName}',
                    methodPhone: 'teléfono',
                    methodEmail: 'correo electrónico',
                    tryDifferentEmail: 'Prueba con otro email',
                    tryDifferentNumber: 'Prueba con otro número',
                    stellarWalletTitle: 'Wallet Stellar',
                    stellarWalletSubtitle: 'Inicia sesión en {clientName} de forma segura',
                    enterCodeTitle: 'Ingresa el código',
                    codeSentTo: 'Enviamos un código de 6 dígitos a {identifier}',
                    codeExpiresIn: 'El código vence en {time}',
                    codeExpired: 'Código caducado',
                    otpPlaceholder: '000000',
                    resend: '¿No recibiste el código? Reenviar',
                    changeEmail: 'Cambiar email',
                    changeNumber: 'Cambiar número',
                    loginWithWallet: 'Entrar con wallet Stellar',

                    otpDeliveryPreference: 'Elige dónde quieres recibir tu código de confirmación.',
                    otpDeliverySingle: 'Te enviaremos el código de confirmación por {channel}.',
                    authPasswordTitle: 'Contraseña',
                    authPasswordSubtitle: 'Credenciales estándar',
                    authEmailTitle: 'Email',
                    authEmailSubtitle: 'Código de verificación por email',
                    authSmsTitle: 'SMS',
                    authSmsSubtitle: 'Código de verificación por SMS',
                    authWalletTitle: 'Wallet',
                    authWalletSubtitle: 'Firma con wallet Stellar',
                },
            },
        },
        messages: {
            // Legacy
            otpSent: 'OTP sent. Please verify to continue.',
            otpSendFailed: 'Failed to send OTP.',
            verificationFailed: 'Verification failed.',
            loginFailed: 'Login failed.',
            registrationFailed: 'Registration failed.',
            walletLoginFailed: 'Wallet login failed.',
            unexpectedError: 'An unexpected error occurred.',

            locales: {
                en: {
                    otpSent: 'OTP sent. Please verify to continue.',
                    otpSendFailed: 'Failed to send OTP.',
                    verificationFailed: 'Verification failed.',
                    loginFailed: 'Login failed.',
                    registrationFailed: 'Registration failed.',
                    walletLoginFailed: 'Wallet login failed.',
                    unexpectedError: 'An unexpected error occurred.',
                    accountNotFoundTitle: 'New to {clientName}?',
                    accountNotFoundBody: "We couldn't find an account for {identifier}.",
                    accountAlreadyExists: 'An account already exists. Try signing in instead.',
                    invalidSession: 'Invalid or expired login session.',
                    walletMissingExtension: 'Freighter wallet extension not found. Please install it first.',
                    walletCouldNotGetAddress: 'Could not get address from Freighter.',
                    walletFailedToGetNonce: 'Failed to get nonce from server.',
                    walletSigningFailed: 'Wallet signing failed.',
                    walletFailedToLogin: 'Failed to login with wallet.',
                },
                es: {
                    otpSent: 'Código enviado. Verifícalo para continuar.',
                    otpSendFailed: 'No se pudo enviar el código.',
                    verificationFailed: 'La verificación falló.',
                    loginFailed: 'Error al iniciar sesión.',
                    registrationFailed: 'Error al registrarse.',
                    walletLoginFailed: 'Error al iniciar sesión con la wallet.',
                    unexpectedError: 'Ocurrió un error inesperado.',
                    accountNotFoundTitle: '¿Eres nuevo en {clientName}?',
                    accountNotFoundBody: 'No encontramos una cuenta para {identifier}.',
                    accountAlreadyExists: 'Ya existe una cuenta. Intenta iniciar sesión.',
                    invalidSession: 'Sesión de inicio inválida o caducada.',
                    walletMissingExtension: 'No se encontró la extensión Freighter. Instálala primero.',
                    walletCouldNotGetAddress: 'No se pudo obtener la dirección desde Freighter.',
                    walletFailedToGetNonce: 'No se pudo obtener el nonce del servidor.',
                    walletSigningFailed: 'Falló la firma de la wallet.',
                    walletFailedToLogin: 'No se pudo iniciar sesión con la wallet.',
                },
            },
            styles: {
                successTextColor: '',
                successBackgroundColor: '',
                successBorderColor: '',
                errorTextColor: '',
                errorBackgroundColor: '',
                errorBorderColor: '',
                infoTextColor: '',
                infoBackgroundColor: '',
                infoBorderColor: '',
            },
        },
    });

    const applyPreset = (preset: 'dark' | 'light') => {
        const patch: Partial<BrandingSettings> =
            preset === 'light'
                ? {
                    backgroundColor: '#ffffff',
                    loginContainer: {
                        backgroundColor: '#ffffff',
                        borderColor: '#e2e8f0',
                    },
                    controls: {
                        primaryButton: {
                            textColor: '#0A192F',
                            hoverTextColor: '#0A192F',
                            borderColor: 'transparent',
                        },
                        input: {
                            backgroundColor: '#ffffff',
                            borderColor: '#e2e8f0',
                            textColor: '#0f172a',
                            placeholderColor: '#94a3b8',
                            hoverBackgroundColor: '#f8fafc',
                            hoverBorderColor: '#cbd5e1',
                            focusBorderColor: primaryHex6,
                            disabledBackgroundColor: '#f1f5f9',
                            disabledBorderColor: '#e2e8f0',
                            disabledTextColor: '#94a3b8',
                            errorBorderColor: '#ef4444',
                        },
                        select: {
                            triggerBackgroundColor: '#ffffff',
                            triggerHoverBackgroundColor: '#f8fafc',
                            triggerBorderColor: '#e2e8f0',
                            triggerTextColor: '#0f172a',
                            menuBackgroundColor: '#ffffff',
                            menuBorderColor: '#e2e8f0',
                            itemHoverBackgroundColor: '#f1f5f9',
                            itemActiveBackgroundColor: `${primaryHex6}20`,
                            itemTextColor: '#0f172a',
                            itemSubtextColor: '#64748b',
                        },
                        secondaryLink: {
                            textColor: '#475569',
                            hoverTextColor: '#0f172a',
                        },
                        loading: {
                            spinnerColor: '#0f172a',
                            spinnerOnPrimaryColor: '#0A192F',
                            backgroundColor: '#ffffff',
                            borderColor: '#e2e8f0',
                        },
                    },
                    colors: {
                        title: '#0f172a',
                        subtitle: '#475569',
                        footer: '#64748b',
                    },
                    authCards: {
                        password: {
                            backgroundColor: '#ffffff',
                            borderColor: '#e2e8f0',
                            hoverBackgroundColor: '#f8fafc',
                            hoverBorderColor: '#cbd5e1',
                            hoverOverlayColor: `${primaryHex6}14`,
                            arrowColor: '#64748b',
                            colors: { title: '#0f172a', subtitle: '#475569' },
                        },
                        emailOtp: {
                            backgroundColor: '#ffffff',
                            borderColor: '#e2e8f0',
                            hoverBackgroundColor: '#f8fafc',
                            hoverBorderColor: '#cbd5e1',
                            hoverOverlayColor: `${primaryHex6}14`,
                            arrowColor: '#64748b',
                            colors: { title: '#0f172a', subtitle: '#475569' },
                        },
                        smsOtp: {
                            backgroundColor: '#ffffff',
                            borderColor: '#e2e8f0',
                            hoverBackgroundColor: '#f8fafc',
                            hoverBorderColor: '#cbd5e1',
                            hoverOverlayColor: `${primaryHex6}14`,
                            arrowColor: '#64748b',
                            colors: { title: '#0f172a', subtitle: '#475569' },
                        },
                        wallet: {
                            backgroundColor: '#ffffff',
                            borderColor: '#e2e8f0',
                            hoverBackgroundColor: '#f8fafc',
                            hoverBorderColor: '#cbd5e1',
                            hoverOverlayColor: `${primaryHex6}14`,
                            arrowColor: '#64748b',
                            colors: { title: '#0f172a', subtitle: '#475569' },
                        },
                    },
                }
                : {
                    backgroundColor: '#0a0f1e',
                    loginContainer: {
                        backgroundColor: '#0A192FCC',
                        borderColor: '#FFFFFF1A',
                    },
                    controls: {
                        primaryButton: {
                            textColor: '#0A192F',
                            hoverTextColor: '#0A192F',
                            borderColor: 'transparent',
                        },
                        input: {
                            backgroundColor: '#FFFFFF0D',
                            borderColor: '#FFFFFF1A',
                            textColor: '#ffffff',
                            placeholderColor: '#94A3B880',
                            hoverBackgroundColor: '#FFFFFF14',
                            hoverBorderColor: '#FFFFFF2E',
                            focusBorderColor: primaryHex6,
                            disabledBackgroundColor: '#FFFFFF08',
                            disabledBorderColor: '#FFFFFF14',
                            disabledTextColor: '#94A3B8CC',
                            errorBorderColor: '#ef4444',
                        },
                        select: {
                            triggerBackgroundColor: '#FFFFFF0D',
                            triggerHoverBackgroundColor: '#FFFFFF1A',
                            triggerBorderColor: '#FFFFFF1A',
                            triggerTextColor: '#ffffff',
                            menuBackgroundColor: '#0A192FF2',
                            menuBorderColor: '#FFFFFF1A',
                            itemHoverBackgroundColor: '#FFFFFF1A',
                            itemActiveBackgroundColor: `${primaryHex6}20`,
                            itemTextColor: '#ffffff',
                            itemSubtextColor: '#94A3B8',
                        },
                        secondaryLink: {
                            textColor: '#94a3b8',
                            hoverTextColor: '#ffffff',
                        },
                        loading: {
                            spinnerColor: '#ffffff',
                            spinnerOnPrimaryColor: '#0A192F',
                            backgroundColor: '#0A192FCC',
                            borderColor: '#FFFFFF1A',
                        },
                    },
                    colors: {
                        title: '#ffffff',
                        subtitle: '#94a3b8',
                        footer: '#94a3b8',
                    },
                    authCards: {
                        password: {
                            backgroundColor: '#FFFFFF0D',
                            borderColor: '#FFFFFF1A',
                            hoverBackgroundColor: '#FFFFFF14',
                            hoverBorderColor: '#FFFFFF2E',
                            hoverOverlayColor: '#FFFFFF0D',
                            arrowColor: '#94a3b8',
                            colors: { title: '#ffffff', subtitle: '#94a3b8' },
                        },
                        emailOtp: {
                            backgroundColor: '#FFFFFF0D',
                            borderColor: '#FFFFFF1A',
                            hoverBackgroundColor: '#FFFFFF14',
                            hoverBorderColor: '#FFFFFF2E',
                            hoverOverlayColor: '#FFFFFF0D',
                            arrowColor: '#94a3b8',
                            colors: { title: '#ffffff', subtitle: '#94a3b8' },
                        },
                        smsOtp: {
                            backgroundColor: '#FFFFFF0D',
                            borderColor: '#FFFFFF1A',
                            hoverBackgroundColor: '#FFFFFF14',
                            hoverBorderColor: '#FFFFFF2E',
                            hoverOverlayColor: '#FFFFFF0D',
                            arrowColor: '#94a3b8',
                            colors: { title: '#ffffff', subtitle: '#94a3b8' },
                        },
                        wallet: {
                            backgroundColor: '#FFFFFF0D',
                            borderColor: '#FFFFFF1A',
                            hoverBackgroundColor: '#FFFFFF14',
                            hoverBorderColor: '#FFFFFF2E',
                            hoverOverlayColor: '#FFFFFF0D',
                            arrowColor: '#94a3b8',
                            colors: { title: '#ffffff', subtitle: '#94a3b8' },
                        },
                    },
                };

        setBranding(prev => {
            const next: BrandingSettings = {
                ...prev,
                ...patch,
                loginContainer: {
                    ...(prev.loginContainer || {}),
                    ...((patch as any).loginContainer || {}),
                },
                colors: {
                    ...(prev.colors || {}),
                    ...((patch as any).colors || {}),
                },
                controls: {
                    ...(prev.controls || {}),
                    ...((patch as any).controls || {}),
                    primaryButton: {
                        ...(((prev.controls || {}) as any).primaryButton || {}),
                        ...((((patch as any).controls || {}) as any).primaryButton || {}),
                        labels: {
                            ...((((prev.controls || {}) as any).primaryButton || {}) as any).labels,
                            ...(((((patch as any).controls || {}) as any).primaryButton || {}) as any).labels,
                        },
                    },
                    input: {
                        ...(((prev.controls || {}) as any).input || {}),
                        ...((((patch as any).controls || {}) as any).input || {}),
                    },
                    select: {
                        ...(((prev.controls || {}) as any).select || {}),
                        ...((((patch as any).controls || {}) as any).select || {}),
                    },
                    secondaryLink: {
                        ...(((prev.controls || {}) as any).secondaryLink || {}),
                        ...((((patch as any).controls || {}) as any).secondaryLink || {}),
                    },
                    loading: {
                        ...(((prev.controls || {}) as any).loading || {}),
                        ...((((patch as any).controls || {}) as any).loading || {}),
                    },
                },
                authCards: {
                    ...(prev.authCards || {}),
                },
            };

            for (const def of AUTH_CARD_DEFS) {
                const prevCard = (prev.authCards || {})[def.key] || {};
                const patchCard = (((patch as any).authCards || {})[def.key] || {}) as any;
                (next.authCards as any)[def.key] = {
                    ...prevCard,
                    ...patchCard,
                    colors: {
                        ...(prevCard as any).colors,
                        ...(patchCard as any).colors,
                    },
                };
            }

            return next;
        });
    };

    const [branding, setBranding] = useState<BrandingSettings>(() => {
        const defaults = getBaseDefaults();

        return {
            ...defaults,
            ...initialBranding,
            loginContainer: {
                ...defaults.loginContainer,
                ...initialBranding.loginContainer,
            },
            authCards: {
                ...defaults.authCards,
                ...initialBranding.authCards,
                password: {
                    ...defaults.authCards?.password,
                    ...initialBranding.authCards?.password,
                    colors: {
                        ...defaults.authCards?.password?.colors,
                        ...initialBranding.authCards?.password?.colors,
                    },
                },
                emailOtp: {
                    ...defaults.authCards?.emailOtp,
                    ...initialBranding.authCards?.emailOtp,
                    colors: {
                        ...defaults.authCards?.emailOtp?.colors,
                        ...initialBranding.authCards?.emailOtp?.colors,
                    },
                },
                smsOtp: {
                    ...defaults.authCards?.smsOtp,
                    ...initialBranding.authCards?.smsOtp,
                    colors: {
                        ...defaults.authCards?.smsOtp?.colors,
                        ...initialBranding.authCards?.smsOtp?.colors,
                    },
                },
                wallet: {
                    ...defaults.authCards?.wallet,
                    ...initialBranding.authCards?.wallet,
                    colors: {
                        ...defaults.authCards?.wallet?.colors,
                        ...initialBranding.authCards?.wallet?.colors,
                    },
                },
            },
            colors: {
                ...defaults.colors,
                ...initialBranding.colors,
            },
            ui: {
                ...defaults.ui,
                ...initialBranding.ui,
                locales: {
                    ...((defaults.ui || {}).locales || {}),
                    ...((initialBranding.ui || {}).locales || {}),
                    en: {
                        ...((((defaults.ui || {}).locales) || {}) as any).en,
                        ...((((initialBranding.ui || {}).locales) || {}) as any).en,
                    },
                    es: {
                        ...((((defaults.ui || {}).locales) || {}) as any).es,
                        ...((((initialBranding.ui || {}).locales) || {}) as any).es,
                    },
                },
            },
            messages: {
                ...defaults.messages,
                ...initialBranding.messages,
                locales: {
                    ...((defaults.messages || {}).locales || {}),
                    ...((initialBranding.messages || {}).locales || {}),
                    en: {
                        ...(((defaults.messages || {}).locales || {}).en || {}),
                        ...(((initialBranding.messages || {}).locales || {}).en || {}),
                    },
                    es: {
                        ...(((defaults.messages || {}).locales || {}).es || {}),
                        ...(((initialBranding.messages || {}).locales || {}).es || {}),
                    },
                },
                styles: {
                    ...((defaults.messages || {}).styles || {}),
                    ...((initialBranding.messages || {}).styles || {}),
                },
            },
            controls: {
                ...defaults.controls,
                ...initialBranding.controls,
                primaryButton: {
                    ...(defaults.controls?.primaryButton || {}),
                    ...(initialBranding.controls?.primaryButton || {}),
                    labels: {
                        ...(defaults.controls?.primaryButton?.labels || {}),
                        ...(initialBranding.controls?.primaryButton?.labels || {}),
                    },
                },
                input: {
                    ...(defaults.controls?.input || {}),
                    ...(initialBranding.controls?.input || {}),
                },
                select: {
                    ...(defaults.controls?.select || {}),
                    ...(initialBranding.controls?.select || {}),
                },
                secondaryLink: {
                    ...(defaults.controls?.secondaryLink || {}),
                    ...(initialBranding.controls?.secondaryLink || {}),
                },
                loading: {
                    ...(defaults.controls?.loading || {}),
                    ...(initialBranding.controls?.loading || {}),
                },
            },
        };
    });
    const [isPending, startTransition] = useTransition();

    const [editingLocale, setEditingLocale] = useState<string>(() => (branding.locale?.trim() || 'en'));
    const [newLocale, setNewLocale] = useState('');

    const primaryHex6 = toHex6(branding.primaryColor, '#d4af37');
    const primaryLightHex8 = `${primaryHex6}20`;

    const previewDetails = useMemo(() => {
        return {
            clientName: name,
            clientDescription: undefined,
            tenantName: type === 'tenant' ? name : 'Tenant',
            logo: branding.logo,
            invertLogo: branding.invertLogo,
            primaryColor: branding.primaryColor,
            branding,
            scopes: '',
            authMethods: {
                password: true,
                emailOtp: true,
                smsOtp: true,
                wallet: true,
            },
        };
    }, [branding, name, type]);

    const handleChange = (key: string, value: any) => {
        setBranding(prev => ({ ...prev, [key]: value }));
    };

    const handleAuthCardChange = (
        cardKey: keyof NonNullable<BrandingSettings['authCards']>,
        key: 'title' | 'subtitle',
        value: string
    ) => {
        setBranding(prev => ({
            ...prev,
            authCards: {
                ...(prev.authCards || {}),
                [cardKey]: {
                    ...((prev.authCards || {})[cardKey] || {}),
                    [key]: value,
                },
            },
        }));
    };

    const handleAuthCardColorChange = (
        cardKey: keyof NonNullable<BrandingSettings['authCards']>,
        key: 'title' | 'subtitle',
        value: string
    ) => {
        setBranding(prev => ({
            ...prev,
            authCards: {
                ...(prev.authCards || {}),
                [cardKey]: {
                    ...((prev.authCards || {})[cardKey] || {}),
                    colors: {
                        ...(((prev.authCards || {})[cardKey] || {}).colors || {}),
                        [key]: value,
                    },
                },
            },
        }));
    };

    const handleAuthCardStyleChange = (
        cardKey: keyof NonNullable<BrandingSettings['authCards']>,
        key: 'backgroundColor' | 'borderColor' | 'hoverBackgroundColor' | 'hoverBorderColor' | 'hoverOverlayColor' | 'iconColor' | 'iconHoverColor' | 'iconBackgroundColor' | 'arrowColor' | 'arrowHoverColor',
        value: string
    ) => {
        setBranding(prev => ({
            ...prev,
            authCards: {
                ...(prev.authCards || {}),
                [cardKey]: {
                    ...((prev.authCards || {})[cardKey] || {}),
                    [key]: value,
                },
            },
        }));
    };

    const copyAuthCard = (from: AuthCardKey, to: AuthCardKey) => {
        if (from === to) return;
        setBranding(prev => {
            const fromCard = (prev.authCards || {})[from] || {};
            const toCard = (prev.authCards || {})[to] || {};
            return {
                ...prev,
                authCards: {
                    ...(prev.authCards || {}),
                    [to]: {
                        ...toCard,
                        backgroundColor: (fromCard as any).backgroundColor,
                        borderColor: (fromCard as any).borderColor,
                        hoverBackgroundColor: (fromCard as any).hoverBackgroundColor,
                        hoverBorderColor: (fromCard as any).hoverBorderColor,
                        hoverOverlayColor: (fromCard as any).hoverOverlayColor,
                        iconColor: (fromCard as any).iconColor,
                        iconHoverColor: (fromCard as any).iconHoverColor,
                        iconBackgroundColor: (fromCard as any).iconBackgroundColor,
                        arrowColor: (fromCard as any).arrowColor,
                        arrowHoverColor: (fromCard as any).arrowHoverColor,
                        colors: {
                            ...((toCard as any).colors || {}),
                            ...((fromCard as any).colors || {}),
                        },
                    },
                },
            };
        });
    };

    const copyAuthCardToAll = (from: AuthCardKey) => {
        setBranding(prev => {
            const fromCard = (prev.authCards || {})[from] || {};
            const nextAuthCards = { ...(prev.authCards || {}) } as any;
            for (const def of AUTH_CARD_DEFS) {
                if (def.key === from) continue;
                const toCard = nextAuthCards[def.key] || {};
                nextAuthCards[def.key] = {
                    ...toCard,
                    backgroundColor: (fromCard as any).backgroundColor,
                    borderColor: (fromCard as any).borderColor,
                    hoverBackgroundColor: (fromCard as any).hoverBackgroundColor,
                    hoverBorderColor: (fromCard as any).hoverBorderColor,
                    hoverOverlayColor: (fromCard as any).hoverOverlayColor,
                    iconColor: (fromCard as any).iconColor,
                    iconHoverColor: (fromCard as any).iconHoverColor,
                    iconBackgroundColor: (fromCard as any).iconBackgroundColor,
                    arrowColor: (fromCard as any).arrowColor,
                    arrowHoverColor: (fromCard as any).arrowHoverColor,
                    colors: {
                        ...((toCard as any).colors || {}),
                        ...((fromCard as any).colors || {}),
                    },
                };
            }
            return {
                ...prev,
                authCards: nextAuthCards,
            };
        });
    };

    const handleLoginContainerChange = (key: 'backgroundColor' | 'borderColor', value: string) => {
        setBranding(prev => ({
            ...prev,
            loginContainer: {
                ...(prev.loginContainer || {}),
                [key]: value,
            },
        }));
    };

    const handleColorChange = (key: keyof NonNullable<BrandingSettings['colors']>, value: string) => {
        setBranding(prev => ({
            ...prev,
            colors: {
                ...(prev.colors || {}),
                [key]: value,
            },
        }));
    };

    const handleLocaleChange = (value: string) => {
        setEditingLocale(value);
        setBranding(prev => ({
            ...prev,
            locale: value,
        }));
    };

    const availableLocales = useMemo(() => {
        const uiLocales = Object.keys((branding.ui || {}).locales || {});
        const msgLocales = Object.keys((branding.messages as any)?.locales || {});
        const seed = ['en', 'es'];
        return Array.from(new Set([...seed, ...uiLocales, ...msgLocales])).sort();
    }, [branding.ui, branding.messages]);

    const addLocale = () => {
        const code = newLocale.trim();
        if (!code) return;

        setBranding(prev => {
            const prevUiLocales = ((prev.ui || {}).locales || {}) as Record<string, Record<string, string>>;
            const prevMsgLocales = (((prev.messages || {}) as any).locales || {}) as Record<string, Record<string, string>>;

            const seedUi = prevUiLocales.en || {};
            const seedMsg = prevMsgLocales.en || {};

            return {
                ...prev,
                locale: code,
                ui: {
                    ...(prev.ui || {}),
                    locales: {
                        ...prevUiLocales,
                        [code]: {
                            ...seedUi,
                            ...(prevUiLocales[code] || {}),
                        },
                    },
                },
                messages: {
                    ...(prev.messages || {}),
                    locales: {
                        ...prevMsgLocales,
                        [code]: {
                            ...seedMsg,
                            ...(prevMsgLocales[code] || {}),
                        },
                    },
                } as any,
            };
        });

        setEditingLocale(code);
        setNewLocale('');
    };

    const getMessageTextValue = (key: string) => {
        const fromLocale = (branding.messages as any)?.locales?.[editingLocale]?.[key];
        const fromLegacy = (branding.messages as any)?.[key];
        return (fromLocale ?? fromLegacy ?? '') as string;
    };

    const handleMessageTextChange = (key: string, value: string) => {
        setBranding(prev => ({
            ...prev,
            messages: {
                ...(prev.messages || {}),
                locales: {
                    ...(((prev.messages || {}).locales) || {}),
                    [editingLocale]: {
                        ...(((((prev.messages || {}).locales) || {}) as any)[editingLocale] || {}),
                        [key]: value,
                    },
                },
            },
        }));
    };

    const getUiTextValue = (key: string) => {
        return (((branding.ui || {}).locales || {}) as any)?.[editingLocale]?.[key] ?? '';
    };

    const handleUiTextChange = (key: string, value: string) => {
        setBranding(prev => ({
            ...prev,
            ui: {
                ...(prev.ui || {}),
                locales: {
                    ...(((prev.ui || {}).locales) || {}),
                    [editingLocale]: {
                        ...(((((prev.ui || {}).locales) || {}) as any)[editingLocale] || {}),
                        [key]: value,
                    },
                },
            },
        }));
    };

    const handleMessageStyleChange = (
        key: keyof NonNullable<NonNullable<BrandingSettings['messages']>['styles']>,
        value: string
    ) => {
        setBranding(prev => ({
            ...prev,
            messages: {
                ...(prev.messages || {}),
                styles: {
                    ...(((prev.messages || {}).styles) || {}),
                    [key]: value,
                },
            },
        }));
    };

    const clearMessageStyleGroup = (prefix: 'success' | 'error' | 'info') => {
        setBranding(prev => ({
            ...prev,
            messages: {
                ...(prev.messages || {}),
                styles: {
                    ...(((prev.messages || {}).styles) || {}),
                    [`${prefix}TextColor`]: '',
                    [`${prefix}BackgroundColor`]: '',
                    [`${prefix}BorderColor`]: '',
                } as any,
            },
        }));
    };

    const clearAllMessageStyles = () => {
        setBranding(prev => ({
            ...prev,
            messages: {
                ...(prev.messages || {}),
                styles: {
                    ...(((prev.messages || {}).styles) || {}),
                    successTextColor: '',
                    successBackgroundColor: '',
                    successBorderColor: '',
                    errorTextColor: '',
                    errorBackgroundColor: '',
                    errorBorderColor: '',
                    infoTextColor: '',
                    infoBackgroundColor: '',
                    infoBorderColor: '',
                },
            },
        }));
    };

    const handleControlChange = (
        group: keyof NonNullable<BrandingSettings['controls']>,
        key: string,
        value: string
    ) => {
        setBranding(prev => ({
            ...prev,
            controls: {
                ...(prev.controls || {}),
                [group]: {
                    ...((prev.controls || {})[group] as any),
                    [key]: value,
                },
            },
        }));
    };

    const handlePrimaryButtonLabelChange = (
        key: 'signIn' | 'sendCode' | 'createAccount' | 'createAccountNow' | 'verifyAndSignIn',
        value: string
    ) => {
        setBranding(prev => ({
            ...prev,
            controls: {
                ...(prev.controls || {}),
                primaryButton: {
                    ...((prev.controls || {}).primaryButton || {}),
                    labels: {
                        ...(((prev.controls || {}).primaryButton || {}).labels || {}),
                        [key]: value,
                    },
                },
            },
        }));
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Check file size (max 2MB)
            if (file.size > 2 * 1024 * 1024) {
                toast.error("Logo file size must be less than 2MB");
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                handleChange('logo', base64String);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        startTransition(async () => {
            try {
                await updateBranding(type, id, branding);
                toast.success("Branding updated successfully");
            } catch (error) {
                toast.error("Failed to update branding");
            }
        });
    };

    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 h-[calc(100vh-200px)]">
            {/* Editor Panel */}
            <div className="bg-white rounded-3xl border shadow-sm flex flex-col overflow-hidden">
                <div className="px-8 py-6 border-b flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Branding Editor</h2>
                        <p className="text-sm text-slate-500">{type === 'tenant' ? 'Organization' : 'Application'}: {name}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="hidden md:flex items-center gap-2 mr-2">
                            <button
                                type="button"
                                onClick={() => applyPreset('dark')}
                                disabled={isPending}
                                className="px-3 py-2 bg-white text-slate-800 rounded-xl border hover:bg-slate-50 disabled:opacity-50 transition-all font-semibold"
                            >
                                Dark preset
                            </button>
                            <button
                                type="button"
                                onClick={() => applyPreset('light')}
                                disabled={isPending}
                                className="px-3 py-2 bg-white text-slate-800 rounded-xl border hover:bg-slate-50 disabled:opacity-50 transition-all font-semibold"
                            >
                                Light preset
                            </button>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                setBranding(getBaseDefaults());
                            }}
                            disabled={isPending}
                            className="flex items-center px-4 py-2.5 bg-white text-slate-800 rounded-xl border hover:bg-slate-50 disabled:opacity-50 transition-all font-semibold"
                        >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Reset
                        </button>

                        <button
                            onClick={handleSave}
                            disabled={isPending}
                            className="flex items-center px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all font-semibold shadow-lg shadow-blue-200"
                        >
                            {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                            Save Changes
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-thin">
                    {/* Visual Section */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 text-slate-900">
                            <Palette className="w-5 h-5 text-blue-500" />
                            <h3 className="font-bold">Visual Identity</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2 col-span-1 md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-2">Application Logo</label>
                                <div className="flex items-center gap-6">
                                    <div className="flex-shrink-0">
                                        <div className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 bg-white flex items-center justify-center overflow-hidden relative group transition-colors hover:border-blue-400">
                                            {branding.logo ? (
                                                <img
                                                    src={branding.logo}
                                                    alt="Logo preview"
                                                    className="w-full h-full object-contain p-2"
                                                />
                                            ) : (
                                                <div className="text-slate-300 group-hover:text-blue-400 transition-colors">
                                                    <Palette className="w-8 h-8 mx-auto mb-1" />
                                                    <span className="text-[10px] block text-center font-medium">No Logo</span>
                                                </div>
                                            )}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleLogoUpload}
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                            />
                                        </div>
                                        {branding.logo && (
                                            <button
                                                type="button"
                                                onClick={() => handleChange('logo', null)}
                                                className="mt-2 text-xs text-red-500 hover:text-red-700 font-medium flex items-center justify-center w-full"
                                            >
                                                <Trash2 className="w-3 h-3 mr-1" /> Remove
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex-1 space-y-2 text-sm text-slate-500">
                                        <p>Upload your application logo to be displayed on the login screen and emails.</p>
                                        <p className="text-xs text-slate-400">Recommended size: 512x512px. Max size: 2MB. formats: PNG, JPG, WEBP.</p>
                                    </div>
                                </div>

                                {branding.logo && (
                                    <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl mt-4">
                                        <input
                                            type="checkbox"
                                            id="invertLogo"
                                            checked={branding.invertLogo || false}
                                            onChange={(e) => handleChange('invertLogo', e.target.checked)}
                                            className="w-4 h-4 text-blue-600 bg-white border-blue-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                                        />
                                        <label htmlFor="invertLogo" className="text-sm font-medium text-blue-900 cursor-pointer flex-1">
                                            Invert logo colors (for white logos on dark backgrounds)
                                        </label>
                                    </div>
                                )}

                                <div className="mt-4 space-y-2">
                                    <label className="block text-sm font-semibold text-slate-700">Logo Size</label>
                                    <div className="flex flex-wrap gap-2">
                                        {([
                                            { label: '100%', value: 1 },
                                            { label: '75%', value: 0.75 },
                                            { label: '50%', value: 0.5 },
                                            { label: '25%', value: 0.25 },
                                        ] as const).map((opt) => (
                                            <button
                                                key={opt.label}
                                                type="button"
                                                onClick={() => handleChange('logoScale', opt.value)}
                                                disabled={!branding.logo}
                                                className={`px-4 py-2 rounded-xl border text-sm font-semibold transition-colors disabled:opacity-50 ${
                                                    (branding.logoScale || 1) === opt.value
                                                        ? 'bg-blue-600 text-white border-blue-600'
                                                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                                }`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-xs text-slate-400">Applies to the login screen logo.</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Primary Color</label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        value={toColorInputValue(branding.primaryColor, '#3b82f6')}
                                        onChange={(e) => handleChange('primaryColor', e.target.value)}
                                        className="h-10 w-12 p-1 bg-slate-50 border rounded-lg cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={branding.primaryColor || ''}
                                        onChange={(e) => handleChange('primaryColor', e.target.value)}
                                        placeholder="#3b82f6"
                                        className="flex-1 px-4 py-2 bg-slate-50 border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Page Background Color</label>
                            <div className="flex gap-2">
                                <input
                                    type="color"
                                    value={toColorInputValue(branding.backgroundColor, '#0a0f1e')}
                                    onChange={(e) => handleChange('backgroundColor', e.target.value)}
                                    className="h-10 w-12 p-1 bg-slate-50 border rounded-lg cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={branding.backgroundColor || ''}
                                    onChange={(e) => handleChange('backgroundColor', e.target.value)}
                                    placeholder="#0f172a"
                                    className="flex-1 px-4 py-2 bg-slate-50 border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="space-y-6 pt-6 border-t">
                        <div className="flex items-center gap-2 text-slate-900">
                            <Type className="w-5 h-5 text-purple-500" />
                            <h3 className="font-bold">Login Page Content</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Form Title</label>
                                <input
                                    type="text"
                                    value={getUiTextValue('loginTitle')}
                                    onChange={(e) => handleUiTextChange('loginTitle', e.target.value)}
                                    placeholder="Sign in to {clientName}"
                                    className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Form Subtitle</label>
                                <textarea
                                    value={getUiTextValue('loginSubtitle')}
                                    onChange={(e) => handleUiTextChange('loginSubtitle', e.target.value)}
                                    placeholder="Enter your credentials to continue"
                                    className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all h-20 resize-none"
                                />
                            </div>

                            <div className="pt-4 border-t space-y-4">
                                <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border rounded-xl">
                                    <input
                                        type="checkbox"
                                        id="footerTextEnabled"
                                        checked={branding.footerTextEnabled || false}
                                        onChange={(e) => handleChange('footerTextEnabled', e.target.checked)}
                                        className="w-4 h-4 text-blue-600 bg-white border-slate-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                                    />
                                    <label htmlFor="footerTextEnabled" className="text-sm font-semibold text-slate-700 cursor-pointer flex-1">
                                        Customize footer text (otherwise defaults to “{getUiTextValue('poweredByZKey') || 'Powered by ZKey'}”)
                                    </label>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Footer Text</label>
                                    <input
                                        type="text"
                                        value={getUiTextValue('poweredByZKey') || branding.footerText || ''}
                                        onChange={(e) => {
                                            handleUiTextChange('poweredByZKey', e.target.value);
                                            handleChange('footerText', e.target.value);
                                        }}
                                        disabled={!branding.footerTextEnabled}
                                        placeholder={getUiTextValue('poweredByZKey') || 'Powered by ZKey'}
                                        className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-60"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6 pt-6 border-t">
                        <div className="flex items-center gap-2 text-slate-900">
                            <Type className="w-5 h-5 text-slate-500" />
                            <h3 className="font-bold">Login Modal Container</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Container Background</label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        value={toColorInputValue(branding.loginContainer?.backgroundColor, '#0A192FCC')}
                                        onChange={(e) => handleLoginContainerChange('backgroundColor', e.target.value)}
                                        className="h-10 w-12 p-1 bg-slate-50 border rounded-lg cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={branding.loginContainer?.backgroundColor || ''}
                                        onChange={(e) => handleLoginContainerChange('backgroundColor', e.target.value)}
                                        placeholder="#0A192FCC"
                                        className="flex-1 px-4 py-2 bg-slate-50 border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Container Border</label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        value={toColorInputValue(branding.loginContainer?.borderColor, '#FFFFFF1A')}
                                        onChange={(e) => handleLoginContainerChange('borderColor', e.target.value)}
                                        className="h-10 w-12 p-1 bg-slate-50 border rounded-lg cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={branding.loginContainer?.borderColor || ''}
                                        onChange={(e) => handleLoginContainerChange('borderColor', e.target.value)}
                                        placeholder="#FFFFFF1A"
                                        className="flex-1 px-4 py-2 bg-slate-50 border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6 pt-6 border-t">
                        <div className="flex items-center gap-2 text-slate-900">
                            <Type className="w-5 h-5 text-emerald-600" />
                            <h3 className="font-bold">Form Controls</h3>
                        </div>

                        <div className="space-y-6">
                            <div className="p-5 rounded-2xl border bg-slate-50/50 space-y-4">
                                <div className="font-bold text-slate-900">Primary Button</div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {(
                                        [
                                            { key: 'backgroundColor', label: 'Background', fallback: primaryHex6 },
                                            { key: 'hoverBackgroundColor', label: 'Hover Background', fallback: `${primaryHex6}E6` },
                                            { key: 'textColor', label: 'Text Color', fallback: '#0A192F' },
                                            { key: 'hoverTextColor', label: 'Hover Text Color', fallback: '#0A192F' },
                                            { key: 'borderColor', label: 'Border', fallback: 'transparent' },
                                            { key: 'hoverBorderColor', label: 'Hover Border', fallback: 'transparent' },
                                            { key: 'disabledBackgroundColor', label: 'Disabled Background', fallback: '#94A3B859' },
                                            { key: 'disabledTextColor', label: 'Disabled Text', fallback: '#ffffff' },
                                            { key: 'disabledBorderColor', label: 'Disabled Border', fallback: 'transparent' },
                                        ] as const
                                    ).map(({ key, label, fallback }) => (
                                        <div key={key} className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700">{label}</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="color"
                                                    value={toColorInputValue((branding.controls?.primaryButton as any)?.[key], toColorInputValue(fallback, '#000000'))}
                                                    onChange={(e) => handleControlChange('primaryButton', key, e.target.value)}
                                                    className="h-10 w-12 p-1 bg-white border rounded-lg cursor-pointer"
                                                />
                                                <input
                                                    type="text"
                                                    value={((branding.controls?.primaryButton as any)?.[key] as string) || ''}
                                                    onChange={(e) => handleControlChange('primaryButton', key, e.target.value)}
                                                    placeholder={fallback}
                                                    className="flex-1 px-4 py-2 bg-white border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-4 border-t space-y-4">
                                    <div className="font-bold text-slate-900">Button Text</div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700">Sign In</label>
                                            <input
                                                type="text"
                                                value={branding.controls?.primaryButton?.labels?.signIn || ''}
                                                onChange={(e) => handlePrimaryButtonLabelChange('signIn', e.target.value)}
                                                placeholder="Sign In"
                                                className="w-full px-4 py-2.5 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700">Send Code</label>
                                            <input
                                                type="text"
                                                value={branding.controls?.primaryButton?.labels?.sendCode || ''}
                                                onChange={(e) => handlePrimaryButtonLabelChange('sendCode', e.target.value)}
                                                placeholder="Send Code"
                                                className="w-full px-4 py-2.5 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700">Create Account</label>
                                            <input
                                                type="text"
                                                value={branding.controls?.primaryButton?.labels?.createAccount || ''}
                                                onChange={(e) => handlePrimaryButtonLabelChange('createAccount', e.target.value)}
                                                placeholder="Create Account"
                                                className="w-full px-4 py-2.5 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700">Create Account Now</label>
                                            <input
                                                type="text"
                                                value={branding.controls?.primaryButton?.labels?.createAccountNow || ''}
                                                onChange={(e) => handlePrimaryButtonLabelChange('createAccountNow', e.target.value)}
                                                placeholder="Create Account Now"
                                                className="w-full px-4 py-2.5 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-sm font-semibold text-slate-700">Verify & Sign In</label>
                                            <input
                                                type="text"
                                                value={branding.controls?.primaryButton?.labels?.verifyAndSignIn || ''}
                                                onChange={(e) => handlePrimaryButtonLabelChange('verifyAndSignIn', e.target.value)}
                                                placeholder="Verify & Sign In"
                                                className="w-full px-4 py-2.5 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-5 rounded-2xl border bg-slate-50/50 space-y-4">
                                <div className="font-bold text-slate-900">Secondary Links ("Back to options")</div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {(
                                        [
                                            { key: 'textColor', label: 'Text Color', fallback: '#94a3b8' },
                                            { key: 'hoverTextColor', label: 'Hover Text Color', fallback: '#ffffff' },
                                        ] as const
                                    ).map(({ key, label, fallback }) => (
                                        <div key={key} className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700">{label}</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="color"
                                                    value={toColorInputValue((branding.controls?.secondaryLink as any)?.[key], toColorInputValue(fallback, '#000000'))}
                                                    onChange={(e) => handleControlChange('secondaryLink', key, e.target.value)}
                                                    className="h-10 w-12 p-1 bg-white border rounded-lg cursor-pointer"
                                                />
                                                <input
                                                    type="text"
                                                    value={((branding.controls?.secondaryLink as any)?.[key] as string) || ''}
                                                    onChange={(e) => handleControlChange('secondaryLink', key, e.target.value)}
                                                    placeholder={fallback}
                                                    className="flex-1 px-4 py-2 bg-white border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-5 rounded-2xl border bg-slate-50/50 space-y-4">
                                <div className="font-bold text-slate-900">Loading / Spinner</div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {(
                                        [
                                            { key: 'spinnerColor', label: 'Spinner Color', fallback: '#ffffff' },
                                            { key: 'spinnerOnPrimaryColor', label: 'Spinner Color (on Primary Button)', fallback: '#0A192F' },
                                            { key: 'backgroundColor', label: 'Loading Background', fallback: '#0A192FCC' },
                                            { key: 'borderColor', label: 'Loading Border', fallback: '#FFFFFF1A' },
                                        ] as const
                                    ).map(({ key, label, fallback }) => (
                                        <div key={key} className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700">{label}</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="color"
                                                    value={toColorInputValue((branding.controls?.loading as any)?.[key], toColorInputValue(fallback, '#000000'))}
                                                    onChange={(e) => handleControlChange('loading', key, e.target.value)}
                                                    className="h-10 w-12 p-1 bg-white border rounded-lg cursor-pointer"
                                                />
                                                <input
                                                    type="text"
                                                    value={((branding.controls?.loading as any)?.[key] as string) || ''}
                                                    onChange={(e) => handleControlChange('loading', key, e.target.value)}
                                                    placeholder={fallback}
                                                    className="flex-1 px-4 py-2 bg-white border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-5 rounded-2xl border bg-slate-50/50 space-y-4">
                                <div className="font-bold text-slate-900">Inputs</div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {(
                                        [
                                            { key: 'backgroundColor', label: 'Background', fallback: '#FFFFFF0D' },
                                            { key: 'borderColor', label: 'Border', fallback: '#FFFFFF1A' },
                                            { key: 'textColor', label: 'Text Color', fallback: '#ffffff' },
                                            { key: 'placeholderColor', label: 'Placeholder Color', fallback: '#94A3B880' },
                                            { key: 'hoverBackgroundColor', label: 'Hover Background', fallback: '#FFFFFF14' },
                                            { key: 'hoverBorderColor', label: 'Hover Border', fallback: '#FFFFFF2E' },
                                            { key: 'focusBorderColor', label: 'Focus Border', fallback: primaryHex6 },
                                            { key: 'disabledBackgroundColor', label: 'Disabled Background', fallback: '#FFFFFF08' },
                                            { key: 'disabledBorderColor', label: 'Disabled Border', fallback: '#FFFFFF14' },
                                            { key: 'disabledTextColor', label: 'Disabled Text', fallback: '#94A3B8CC' },
                                            { key: 'errorBorderColor', label: 'Error Border', fallback: '#ef4444' },
                                        ] as const
                                    ).map(({ key, label, fallback }) => (
                                        <div key={key} className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700">{label}</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="color"
                                                    value={toColorInputValue((branding.controls?.input as any)?.[key], toColorInputValue(fallback, '#000000'))}
                                                    onChange={(e) => handleControlChange('input', key, e.target.value)}
                                                    className="h-10 w-12 p-1 bg-white border rounded-lg cursor-pointer"
                                                />
                                                <input
                                                    type="text"
                                                    value={((branding.controls?.input as any)?.[key] as string) || ''}
                                                    onChange={(e) => handleControlChange('input', key, e.target.value)}
                                                    placeholder={fallback}
                                                    className="flex-1 px-4 py-2 bg-white border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-5 rounded-2xl border bg-slate-50/50 space-y-4">
                                <div className="font-bold text-slate-900">Dropdown (Country Code Select)</div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {(
                                        [
                                            { key: 'triggerBackgroundColor', label: 'Trigger Background', fallback: '#FFFFFF0D' },
                                            { key: 'triggerHoverBackgroundColor', label: 'Trigger Hover Background', fallback: '#FFFFFF1A' },
                                            { key: 'triggerBorderColor', label: 'Trigger Border', fallback: '#FFFFFF1A' },
                                            { key: 'triggerTextColor', label: 'Trigger Text Color', fallback: '#ffffff' },
                                            { key: 'menuBackgroundColor', label: 'Menu Background', fallback: '#0A192FF2' },
                                            { key: 'menuBorderColor', label: 'Menu Border', fallback: '#FFFFFF1A' },
                                            { key: 'itemHoverBackgroundColor', label: 'Item Hover Background', fallback: '#FFFFFF1A' },
                                            { key: 'itemActiveBackgroundColor', label: 'Item Active Background', fallback: primaryLightHex8 },
                                            { key: 'itemTextColor', label: 'Item Text Color', fallback: '#ffffff' },
                                            { key: 'itemSubtextColor', label: 'Item Subtext Color', fallback: '#94A3B8' },
                                        ] as const
                                    ).map(({ key, label, fallback }) => (
                                        <div key={key} className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700">{label}</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="color"
                                                    value={toColorInputValue((branding.controls?.select as any)?.[key], toColorInputValue(fallback, '#000000'))}
                                                    onChange={(e) => handleControlChange('select', key, e.target.value)}
                                                    className="h-10 w-12 p-1 bg-white border rounded-lg cursor-pointer"
                                                />
                                                <input
                                                    type="text"
                                                    value={((branding.controls?.select as any)?.[key] as string) || ''}
                                                    onChange={(e) => handleControlChange('select', key, e.target.value)}
                                                    placeholder={fallback}
                                                    className="flex-1 px-4 py-2 bg-white border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6 pt-6 border-t">
                        <div className="flex items-center gap-2 text-slate-900">
                            <Type className="w-5 h-5 text-blue-500" />
                            <h3 className="font-bold">Auth Card Labels & Colors</h3>
                        </div>

                        <div className="space-y-6">
                            {AUTH_CARD_DEFS.map(({ key, label }) => (
                                <div key={key} className="p-5 rounded-2xl border bg-slate-50/50 space-y-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="font-bold text-slate-900">{label}</div>
                                        <div className="flex flex-wrap items-center justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    copyAuthCardToAll(key);
                                                    toast.success(`Copied ${label} colors to all cards`);
                                                }}
                                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                                            >
                                                <Copy className="w-3.5 h-3.5" />
                                                Copy to all
                                            </button>

                                            <div className="flex flex-wrap items-center gap-1">
                                                {AUTH_CARD_DEFS.filter(d => d.key !== key).map((d) => (
                                                    <button
                                                        key={d.key}
                                                        type="button"
                                                        onClick={() => {
                                                            copyAuthCard(key, d.key);
                                                            toast.success(`Copied ${label} colors → ${d.label}`);
                                                        }}
                                                        className="px-2.5 py-1.5 bg-white border rounded-xl text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                                                    >
                                                        {d.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700">Title</label>
                                            <input
                                                type="text"
                                                value={branding.authCards?.[key]?.title || ''}
                                                onChange={(e) => handleAuthCardChange(key, 'title', e.target.value)}
                                                className="w-full px-4 py-2.5 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700">Subtitle</label>
                                            <input
                                                type="text"
                                                value={branding.authCards?.[key]?.subtitle || ''}
                                                onChange={(e) => handleAuthCardChange(key, 'subtitle', e.target.value)}
                                                className="w-full px-4 py-2.5 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700">Title Color</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="color"
                                                    value={toColorInputValue(branding.authCards?.[key]?.colors?.title, '#ffffff')}
                                                    onChange={(e) => handleAuthCardColorChange(key, 'title', e.target.value)}
                                                    className="h-10 w-12 p-1 bg-white border rounded-lg cursor-pointer"
                                                />
                                                <input
                                                    type="text"
                                                    value={branding.authCards?.[key]?.colors?.title || ''}
                                                    onChange={(e) => handleAuthCardColorChange(key, 'title', e.target.value)}
                                                    placeholder="#ffffff"
                                                    className="flex-1 px-4 py-2 bg-white border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700">Subtitle Color</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="color"
                                                    value={toColorInputValue(branding.authCards?.[key]?.colors?.subtitle, '#94a3b8')}
                                                    onChange={(e) => handleAuthCardColorChange(key, 'subtitle', e.target.value)}
                                                    className="h-10 w-12 p-1 bg-white border rounded-lg cursor-pointer"
                                                />
                                                <input
                                                    type="text"
                                                    value={branding.authCards?.[key]?.colors?.subtitle || ''}
                                                    onChange={(e) => handleAuthCardColorChange(key, 'subtitle', e.target.value)}
                                                    placeholder="#94a3b8"
                                                    className="flex-1 px-4 py-2 bg-white border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700">Card Background</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="color"
                                                    value={toColorInputValue(branding.authCards?.[key]?.backgroundColor, '#FFFFFF0D')}
                                                    onChange={(e) => handleAuthCardStyleChange(key, 'backgroundColor', e.target.value)}
                                                    className="h-10 w-12 p-1 bg-white border rounded-lg cursor-pointer"
                                                />
                                                <input
                                                    type="text"
                                                    value={branding.authCards?.[key]?.backgroundColor || ''}
                                                    onChange={(e) => handleAuthCardStyleChange(key, 'backgroundColor', e.target.value)}
                                                    placeholder="#FFFFFF0D"
                                                    className="flex-1 px-4 py-2 bg-white border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700">Card Border</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="color"
                                                    value={toColorInputValue(branding.authCards?.[key]?.borderColor, '#FFFFFF1A')}
                                                    onChange={(e) => handleAuthCardStyleChange(key, 'borderColor', e.target.value)}
                                                    className="h-10 w-12 p-1 bg-white border rounded-lg cursor-pointer"
                                                />
                                                <input
                                                    type="text"
                                                    value={branding.authCards?.[key]?.borderColor || ''}
                                                    onChange={(e) => handleAuthCardStyleChange(key, 'borderColor', e.target.value)}
                                                    placeholder="#FFFFFF1A"
                                                    className="flex-1 px-4 py-2 bg-white border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700">Hover Background</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="color"
                                                    value={toColorInputValue((branding.authCards?.[key] as any)?.hoverBackgroundColor, '#FFFFFF14')}
                                                    onChange={(e) => handleAuthCardStyleChange(key, 'hoverBackgroundColor', e.target.value)}
                                                    className="h-10 w-12 p-1 bg-white border rounded-lg cursor-pointer"
                                                />
                                                <input
                                                    type="text"
                                                    value={((branding.authCards?.[key] as any)?.hoverBackgroundColor as string) || ''}
                                                    onChange={(e) => handleAuthCardStyleChange(key, 'hoverBackgroundColor', e.target.value)}
                                                    placeholder="#FFFFFF14"
                                                    className="flex-1 px-4 py-2 bg-white border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700">Hover Border</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="color"
                                                    value={toColorInputValue((branding.authCards?.[key] as any)?.hoverBorderColor, '#FFFFFF2E')}
                                                    onChange={(e) => handleAuthCardStyleChange(key, 'hoverBorderColor', e.target.value)}
                                                    className="h-10 w-12 p-1 bg-white border rounded-lg cursor-pointer"
                                                />
                                                <input
                                                    type="text"
                                                    value={((branding.authCards?.[key] as any)?.hoverBorderColor as string) || ''}
                                                    onChange={(e) => handleAuthCardStyleChange(key, 'hoverBorderColor', e.target.value)}
                                                    placeholder="#FFFFFF2E"
                                                    className="flex-1 px-4 py-2 bg-white border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700">Hover Overlay</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="color"
                                                    value={toColorInputValue((branding.authCards?.[key] as any)?.hoverOverlayColor, '#FFFFFF0D')}
                                                    onChange={(e) => handleAuthCardStyleChange(key, 'hoverOverlayColor', e.target.value)}
                                                    className="h-10 w-12 p-1 bg-white border rounded-lg cursor-pointer"
                                                />
                                                <input
                                                    type="text"
                                                    value={((branding.authCards?.[key] as any)?.hoverOverlayColor as string) || ''}
                                                    onChange={(e) => handleAuthCardStyleChange(key, 'hoverOverlayColor', e.target.value)}
                                                    placeholder="#FFFFFF0D"
                                                    className="flex-1 px-4 py-2 bg-white border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700">Icon Color</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="color"
                                                    value={toColorInputValue(branding.authCards?.[key]?.iconColor, primaryHex6)}
                                                    onChange={(e) => handleAuthCardStyleChange(key, 'iconColor', e.target.value)}
                                                    className="h-10 w-12 p-1 bg-white border rounded-lg cursor-pointer"
                                                />
                                                <input
                                                    type="text"
                                                    value={branding.authCards?.[key]?.iconColor || ''}
                                                    onChange={(e) => handleAuthCardStyleChange(key, 'iconColor', e.target.value)}
                                                    placeholder={primaryHex6}
                                                    className="flex-1 px-4 py-2 bg-white border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700">Icon Hover Color</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="color"
                                                    value={toColorInputValue(branding.authCards?.[key]?.iconHoverColor, primaryHex6)}
                                                    onChange={(e) => handleAuthCardStyleChange(key, 'iconHoverColor', e.target.value)}
                                                    className="h-10 w-12 p-1 bg-white border rounded-lg cursor-pointer"
                                                />
                                                <input
                                                    type="text"
                                                    value={branding.authCards?.[key]?.iconHoverColor || ''}
                                                    onChange={(e) => handleAuthCardStyleChange(key, 'iconHoverColor', e.target.value)}
                                                    placeholder={primaryHex6}
                                                    className="flex-1 px-4 py-2 bg-white border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700">Icon Background</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="color"
                                                    value={toColorInputValue(branding.authCards?.[key]?.iconBackgroundColor, primaryLightHex8)}
                                                    onChange={(e) => handleAuthCardStyleChange(key, 'iconBackgroundColor', e.target.value)}
                                                    className="h-10 w-12 p-1 bg-white border rounded-lg cursor-pointer"
                                                />
                                                <input
                                                    type="text"
                                                    value={branding.authCards?.[key]?.iconBackgroundColor || ''}
                                                    onChange={(e) => handleAuthCardStyleChange(key, 'iconBackgroundColor', e.target.value)}
                                                    placeholder={primaryLightHex8}
                                                    className="flex-1 px-4 py-2 bg-white border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700">Arrow Color</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="color"
                                                    value={toColorInputValue(branding.authCards?.[key]?.arrowColor, '#94a3b8')}
                                                    onChange={(e) => handleAuthCardStyleChange(key, 'arrowColor', e.target.value)}
                                                    className="h-10 w-12 p-1 bg-white border rounded-lg cursor-pointer"
                                                />
                                                <input
                                                    type="text"
                                                    value={branding.authCards?.[key]?.arrowColor || ''}
                                                    onChange={(e) => handleAuthCardStyleChange(key, 'arrowColor', e.target.value)}
                                                    placeholder="#94a3b8"
                                                    className="flex-1 px-4 py-2 bg-white border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700">Arrow Hover Color</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="color"
                                                    value={toColorInputValue(branding.authCards?.[key]?.arrowHoverColor, primaryHex6)}
                                                    onChange={(e) => handleAuthCardStyleChange(key, 'arrowHoverColor', e.target.value)}
                                                    className="h-10 w-12 p-1 bg-white border rounded-lg cursor-pointer"
                                                />
                                                <input
                                                    type="text"
                                                    value={branding.authCards?.[key]?.arrowHoverColor || ''}
                                                    onChange={(e) => handleAuthCardStyleChange(key, 'arrowHoverColor', e.target.value)}
                                                    placeholder={primaryHex6}
                                                    className="flex-1 px-4 py-2 bg-white border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Typography & Messages */}
                    <div className="space-y-6 pt-6 border-t">
                        <div className="flex items-center gap-2 text-slate-900">
                            <Type className="w-5 h-5 text-amber-500" />
                            <h3 className="font-bold">Modal Text Colors</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Title Color</label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        value={toColorInputValue(branding.colors?.title, '#ffffff')}
                                        onChange={(e) => handleColorChange('title', e.target.value)}
                                        className="h-10 w-12 p-1 bg-slate-50 border rounded-lg cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={branding.colors?.title || ''}
                                        onChange={(e) => handleColorChange('title', e.target.value)}
                                        placeholder="#ffffff"
                                        className="flex-1 px-4 py-2 bg-slate-50 border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Subtitle Color</label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        value={toColorInputValue(branding.colors?.subtitle, '#94a3b8')}
                                        onChange={(e) => handleColorChange('subtitle', e.target.value)}
                                        className="h-10 w-12 p-1 bg-slate-50 border rounded-lg cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={branding.colors?.subtitle || ''}
                                        onChange={(e) => handleColorChange('subtitle', e.target.value)}
                                        placeholder="#94a3b8"
                                        className="flex-1 px-4 py-2 bg-slate-50 border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-semibold text-slate-700">Footer Color ("Powered by")</label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        value={toColorInputValue(branding.colors?.footer, '#94a3b8')}
                                        onChange={(e) => handleColorChange('footer', e.target.value)}
                                        className="h-10 w-12 p-1 bg-slate-50 border rounded-lg cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={branding.colors?.footer || ''}
                                        onChange={(e) => handleColorChange('footer', e.target.value)}
                                        placeholder="#94a3b8"
                                        className="flex-1 px-4 py-2 bg-slate-50 border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6 pt-6 border-t">
                        <div className="flex items-center gap-2 text-slate-900">
                            <Type className="w-5 h-5 text-rose-500" />
                            <h3 className="font-bold">Login Messages</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Language</label>
                                <select
                                    value={editingLocale}
                                    onChange={(e) => handleLocaleChange(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                >
                                    {availableLocales.map((l) => (
                                        <option key={l} value={l}>
                                            {l === 'en' ? 'English (en)' : l === 'es' ? 'Español (es)' : l}
                                        </option>
                                    ))}
                                </select>

                                <div className="flex items-center gap-2 mt-2">
                                    <input
                                        type="text"
                                        value={newLocale}
                                        onChange={(e) => setNewLocale(e.target.value)}
                                        placeholder="Add locale code (e.g. fr)"
                                        className="flex-1 px-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={addLocale}
                                        disabled={isPending}
                                        className="px-4 py-2.5 bg-white text-slate-800 rounded-xl border hover:bg-slate-50 disabled:opacity-50 transition-all font-semibold"
                                    >
                                        Add
                                    </button>
                                </div>
                                <p className="text-xs text-slate-500">This sets the default language for the hosted login (and which locale you are editing below).</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">OTP Sent (success)</label>
                                <input
                                    type="text"
                                    value={getMessageTextValue('otpSent')}
                                    onChange={(e) => handleMessageTextChange('otpSent', e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">OTP Send Failed (error)</label>
                                <input
                                    type="text"
                                    value={getMessageTextValue('otpSendFailed')}
                                    onChange={(e) => handleMessageTextChange('otpSendFailed', e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Verification Failed (error)</label>
                                <input
                                    type="text"
                                    value={getMessageTextValue('verificationFailed')}
                                    onChange={(e) => handleMessageTextChange('verificationFailed', e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Login Failed (error)</label>
                                <input
                                    type="text"
                                    value={getMessageTextValue('loginFailed')}
                                    onChange={(e) => handleMessageTextChange('loginFailed', e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Registration Failed (error)</label>
                                <input
                                    type="text"
                                    value={getMessageTextValue('registrationFailed')}
                                    onChange={(e) => handleMessageTextChange('registrationFailed', e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Account Already Exists (error)</label>
                                <input
                                    type="text"
                                    value={getMessageTextValue('accountAlreadyExists')}
                                    onChange={(e) => handleMessageTextChange('accountAlreadyExists', e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Wallet Login Failed (error)</label>
                                <input
                                    type="text"
                                    value={getMessageTextValue('walletLoginFailed')}
                                    onChange={(e) => handleMessageTextChange('walletLoginFailed', e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-semibold text-slate-700">Unexpected Error (fallback)</label>
                                <input
                                    type="text"
                                    value={getMessageTextValue('unexpectedError')}
                                    onChange={(e) => handleMessageTextChange('unexpectedError', e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Account Not Found Title (supports {'{clientName}'})</label>
                                <input
                                    type="text"
                                    value={getMessageTextValue('accountNotFoundTitle')}
                                    onChange={(e) => handleMessageTextChange('accountNotFoundTitle', e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Account Not Found Body (supports {'{identifier}'})</label>
                                <input
                                    type="text"
                                    value={getMessageTextValue('accountNotFoundBody')}
                                    onChange={(e) => handleMessageTextChange('accountNotFoundBody', e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-semibold text-slate-700">Invalid Session</label>
                                <input
                                    type="text"
                                    value={getMessageTextValue('invalidSession')}
                                    onChange={(e) => handleMessageTextChange('invalidSession', e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Wallet: Missing Extension</label>
                                <input
                                    type="text"
                                    value={getMessageTextValue('walletMissingExtension')}
                                    onChange={(e) => handleMessageTextChange('walletMissingExtension', e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Wallet: Could Not Get Address</label>
                                <input
                                    type="text"
                                    value={getMessageTextValue('walletCouldNotGetAddress')}
                                    onChange={(e) => handleMessageTextChange('walletCouldNotGetAddress', e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Wallet: Failed To Get Nonce</label>
                                <input
                                    type="text"
                                    value={getMessageTextValue('walletFailedToGetNonce')}
                                    onChange={(e) => handleMessageTextChange('walletFailedToGetNonce', e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Wallet: Signing Failed</label>
                                <input
                                    type="text"
                                    value={getMessageTextValue('walletSigningFailed')}
                                    onChange={(e) => handleMessageTextChange('walletSigningFailed', e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-semibold text-slate-700">Wallet: Failed To Login</label>
                                <input
                                    type="text"
                                    value={getMessageTextValue('walletFailedToLogin')}
                                    onChange={(e) => handleMessageTextChange('walletFailedToLogin', e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                />
                            </div>
                        </div>

                        <div className="pt-6 border-t space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-bold text-slate-900">Login UI Text (i18n)</h4>
                                    <p className="text-xs text-slate-500">Overrides for labels/placeholders/buttons. Stored in <span className="font-mono">branding.ui.locales[{editingLocale}]</span>.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {([
                                    { key: 'signInToClient', label: 'Title: Sign in to {clientName}', placeholder: 'Sign in to {clientName}' },
                                    { key: 'poweredByZKey', label: 'Footer: Powered by', placeholder: 'Powered by ZKey' },

                                    { key: 'signIn', label: 'Button: Sign In', placeholder: 'Sign In' },
                                    { key: 'sendCode', label: 'Button: Send Code', placeholder: 'Send Code' },
                                    { key: 'createAccount', label: 'Button: Create Account', placeholder: 'Create Account' },
                                    { key: 'createAccountNow', label: 'Button: Create Account Now', placeholder: 'Create Account Now' },
                                    { key: 'verifyAndSignIn', label: 'Button: Verify & Sign In', placeholder: 'Verify & Sign In' },
                                    { key: 'backToOptions', label: 'Link: Back to options', placeholder: 'Back to options' },

                                    { key: 'dontHaveAccount', label: 'Link: Don\'t have an account?', placeholder: "Don't have an account?" },
                                    { key: 'signUp', label: 'Link: Sign up', placeholder: 'Sign up' },
                                    { key: 'alreadyHaveAccount', label: 'Link: Already have an account?', placeholder: 'Already have an account? Sign in' },

                                    { key: 'passwordSubtitle', label: 'Password: Subtitle', placeholder: 'Enter your email and password' },
                                    { key: 'emailPlaceholder', label: 'Input: Email placeholder', placeholder: 'name@example.com' },
                                    { key: 'passwordPlaceholder', label: 'Input: Password placeholder', placeholder: 'Password' },
                                    { key: 'firstNamePlaceholder', label: 'Input: First name placeholder', placeholder: 'First Name' },
                                    { key: 'lastNamePlaceholder', label: 'Input: Last name placeholder', placeholder: 'Last Name' },
                                    { key: 'phonePlaceholder', label: 'Input: Phone placeholder', placeholder: '600 000 000' },

                                    { key: 'createAccountTitle', label: 'Register: Title', placeholder: 'Create Account' },
                                    { key: 'createAccountSubtitle', label: 'Register: Subtitle (supports {clientName})', placeholder: 'Join {clientName} today' },
                                    { key: 'signInTitle', label: 'OTP: Title', placeholder: 'Sign In' },
                                    { key: 'enterYourForClient', label: 'OTP: Subtitle (supports {method} {clientName})', placeholder: 'Enter your {method} for {clientName}' },
                                    { key: 'otpDeliveryPreference', label: 'OTP: Channel selector helper text', placeholder: 'Choose where you want to receive your confirmation code.' },
                                    { key: 'otpDeliverySingle', label: 'OTP (register): Single-channel helper text (supports {channel})', placeholder: "We'll send your confirmation code via {channel}." },
                                    { key: 'methodPhone', label: 'OTP: {method} for phone', placeholder: 'phone' },
                                    { key: 'methodEmail', label: 'OTP: {method} for email', placeholder: 'email' },
                                    { key: 'tryDifferentEmail', label: 'Not found: Try different email', placeholder: 'Try a different email' },
                                    { key: 'tryDifferentNumber', label: 'Not found: Try different number', placeholder: 'Try a different number' },

                                    { key: 'stellarWalletTitle', label: 'Wallet: Title', placeholder: 'Stellar Wallet' },
                                    { key: 'stellarWalletSubtitle', label: 'Wallet: Subtitle (supports {clientName})', placeholder: 'Sign in to {clientName} securely' },
                                    { key: 'loginWithWallet', label: 'Wallet: Button label', placeholder: 'Login with Stellar Wallet' },

                                    { key: 'enterCodeTitle', label: 'Verify: Title', placeholder: 'Enter Code' },
                                    { key: 'codeSentTo', label: 'Verify: Code sent text (supports {identifier})', placeholder: 'We sent a 6-digit code to {identifier}' },
                                    { key: 'codeExpiresIn', label: 'Verify: Expires in (supports {time})', placeholder: 'Code expires in {time}' },
                                    { key: 'codeExpired', label: 'Verify: Code expired', placeholder: 'Code expired' },
                                    { key: 'otpPlaceholder', label: 'Verify: OTP placeholder', placeholder: '000000' },
                                    { key: 'resend', label: 'Verify: Resend', placeholder: "Didn't receive code? Resend" },
                                    { key: 'changeEmail', label: 'Verify: Change email', placeholder: 'Change email' },
                                    { key: 'changeNumber', label: 'Verify: Change number', placeholder: 'Change number' },

                                    { key: 'authPasswordTitle', label: 'Auth card: Password title', placeholder: 'Password' },
                                    { key: 'authPasswordSubtitle', label: 'Auth card: Password subtitle', placeholder: 'Standard credentials' },
                                    { key: 'authEmailTitle', label: 'Auth card: Email title', placeholder: 'Email' },
                                    { key: 'authEmailSubtitle', label: 'Auth card: Email subtitle', placeholder: 'Email verification code' },
                                    { key: 'authSmsTitle', label: 'Auth card: SMS title', placeholder: 'SMS' },
                                    { key: 'authSmsSubtitle', label: 'Auth card: SMS subtitle', placeholder: 'SMS verification code' },
                                    { key: 'authWalletTitle', label: 'Auth card: Wallet title', placeholder: 'Wallet' },
                                    { key: 'authWalletSubtitle', label: 'Auth card: Wallet subtitle', placeholder: 'Stellar wallet signing' },
                                ] as const).map((f) => (
                                    <div key={f.key} className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">{f.label}</label>
                                        <input
                                            type="text"
                                            value={getUiTextValue(f.key)}
                                            onChange={(e) => handleUiTextChange(f.key, e.target.value)}
                                            placeholder={f.placeholder}
                                            className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="pt-6 border-t space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-bold text-slate-900">Message Colors (Inline)</h4>
                                    <p className="text-xs text-slate-500">Customize the inline success/error/info banners inside the login UI.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={clearAllMessageStyles}
                                    disabled={isPending}
                                    className="px-3 py-2 bg-white text-slate-800 rounded-xl border hover:bg-slate-50 disabled:opacity-50 transition-all font-semibold"
                                >
                                    Clear all overrides
                                </button>
                            </div>

                            <p className="text-xs text-slate-500">
                                Tip: leave fields blank to fall back to the login UI defaults (which adapt to light/dark backgrounds).
                            </p>

                            <div className="grid grid-cols-1 gap-6">
                                {([
                                    { label: 'Success', prefix: 'success', defaults: { text: '#166534', bg: '#dcfce7', border: '#86efac' } },
                                    { label: 'Error', prefix: 'error', defaults: { text: '#b91c1c', bg: '#fee2e2', border: '#fca5a5' } },
                                    { label: 'Info', prefix: 'info', defaults: { text: '#0f172a', bg: '#eff6ff', border: '#bfdbfe' } },
                                ] as const).map(group => (
                                    <div key={group.prefix} className="bg-white rounded-2xl border p-4 space-y-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="font-semibold text-slate-800">{group.label}</div>
                                            <button
                                                type="button"
                                                onClick={() => clearMessageStyleGroup(group.prefix)}
                                                disabled={isPending}
                                                className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                                            >
                                                Clear
                                            </button>
                                        </div>

                                        <div
                                            className="text-sm text-center rounded-xl border px-4 py-3"
                                            style={{
                                                color:
                                                    ((branding.messages as any)?.styles?.[`${group.prefix}TextColor`]) ||
                                                    group.defaults.text,
                                                backgroundColor:
                                                    ((branding.messages as any)?.styles?.[`${group.prefix}BackgroundColor`]) ||
                                                    group.defaults.bg,
                                                borderColor:
                                                    ((branding.messages as any)?.styles?.[`${group.prefix}BorderColor`]) ||
                                                    group.defaults.border,
                                            }}
                                        >
                                            Preview: {group.label} message
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700">Text</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="color"
                                                    value={toColorInputValue((branding.messages as any)?.styles?.[`${group.prefix}TextColor`], group.defaults.text)}
                                                    onChange={(e) => handleMessageStyleChange(`${group.prefix}TextColor` as any, e.target.value)}
                                                    className="h-10 w-12 p-1 bg-slate-50 border rounded-lg cursor-pointer"
                                                />
                                                <input
                                                    type="text"
                                                    value={((branding.messages as any)?.styles?.[`${group.prefix}TextColor`]) || ''}
                                                    onChange={(e) => handleMessageStyleChange(`${group.prefix}TextColor` as any, e.target.value)}
                                                    placeholder={group.defaults.text}
                                                    className="flex-1 px-4 py-2 bg-slate-50 border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700">Background</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="color"
                                                    value={toColorInputValue((branding.messages as any)?.styles?.[`${group.prefix}BackgroundColor`], group.defaults.bg)}
                                                    onChange={(e) => handleMessageStyleChange(`${group.prefix}BackgroundColor` as any, e.target.value)}
                                                    className="h-10 w-12 p-1 bg-slate-50 border rounded-lg cursor-pointer"
                                                />
                                                <input
                                                    type="text"
                                                    value={((branding.messages as any)?.styles?.[`${group.prefix}BackgroundColor`]) || ''}
                                                    onChange={(e) => handleMessageStyleChange(`${group.prefix}BackgroundColor` as any, e.target.value)}
                                                    placeholder={group.defaults.bg}
                                                    className="flex-1 px-4 py-2 bg-slate-50 border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700">Border</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="color"
                                                    value={toColorInputValue((branding.messages as any)?.styles?.[`${group.prefix}BorderColor`], group.defaults.border)}
                                                    onChange={(e) => handleMessageStyleChange(`${group.prefix}BorderColor` as any, e.target.value)}
                                                    className="h-10 w-12 p-1 bg-slate-50 border rounded-lg cursor-pointer"
                                                />
                                                <input
                                                    type="text"
                                                    value={((branding.messages as any)?.styles?.[`${group.prefix}BorderColor`]) || ''}
                                                    onChange={(e) => handleMessageStyleChange(`${group.prefix}BorderColor` as any, e.target.value)}
                                                    placeholder={group.defaults.border}
                                                    className="flex-1 px-4 py-2 bg-slate-50 border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Preview Panel */}
            <div className="bg-slate-900 rounded-3xl overflow-hidden relative shadow-2xl flex flex-col">
                <div className="px-6 py-4 bg-slate-800/50 border-b border-slate-700/50 flex items-center gap-2 text-slate-400">
                    <Monitor className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-widest">Live Preview</span>
                    <span className="ml-auto text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        Lang: {(branding.locale || 'en').toString()}
                    </span>
                </div>

                <div
                    className="flex-1 flex items-start justify-center p-8 pb-16 overflow-y-auto transition-colors duration-500"
                    style={{ backgroundColor: branding.backgroundColor || '#0a0f1e' }}
                >
                    <LoginForm
                        previewDetails={previewDetails as any}
                        previewMessages={{
                            success: 'Preview: Success message',
                            error: 'Preview: Error message',
                            info: 'Preview: Info message',
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
