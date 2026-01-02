"use client";

import { useState, useEffect, type CSSProperties } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Wallet, Mail, ArrowRight, Loader2, ShieldCheck, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { requestOtpAction, loginWithPasswordAction, loginWithOtpAction, loginWithWalletAction, getInteractionDetails, registerAction } from '../actions';
import CountryCodeSelect from '@/components/ui/country-code-select';
import { useAutoCountryCode } from '@/hooks/use-auto-country-code';
import { WalletLogin } from '@/components/auth/wallet-login';

type LoginMethod = 'phone' | 'email' | 'wallet' | 'password';
type Step = 'choose' | 'input' | 'verify' | 'register';
type AuthCardKey = 'password' | 'emailOtp' | 'smsOtp' | 'wallet';

type BaseLocale = 'en' | 'es';
type Locale = BaseLocale | (string & {});

const DEFAULT_MESSAGES: Record<BaseLocale, Record<string, string>> = {
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
};

const DEFAULT_UI: Record<BaseLocale, Record<string, string>> = {
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
};

const interpolate = (template: string, vars?: Record<string, string>) => {
    if (!vars) return template;
    return template.replace(/\{(\w+)\}/g, (_, k: string) => (vars[k] ?? `{${k}}`));
};

interface InteractionDetails {
    clientName: string;
    clientDescription?: string;
    tenantName: string;
    logo?: string;
    invertLogo?: boolean;
    primaryColor?: string;
    branding?: {
        locale?: string;
        logoScale?: 1 | 0.75 | 0.5 | 0.25;
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
            // Legacy (non-localized) message overrides
            otpSent?: string;
            otpSendFailed?: string;
            verificationFailed?: string;
            loginFailed?: string;
            registrationFailed?: string;
            walletLoginFailed?: string;
            unexpectedError?: string;

            // Additional flows
            accountNotFoundTitle?: string; // supports {clientName}
            accountNotFoundBody?: string; // supports {identifier}
            accountAlreadyExists?: string;
            invalidSession?: string;

            // Wallet flow
            walletMissingExtension?: string;
            walletCouldNotGetAddress?: string;
            walletFailedToGetNonce?: string;
            walletSigningFailed?: string;
            walletFailedToLogin?: string;

            // i18n overrides
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
    };
    scopes: string;
    authMethods?: {
        password?: boolean;
        emailOtp?: boolean;
        smsOtp?: boolean;
        wallet?: boolean;
    };
}

function LoginContent({
    previewDetails,
    previewMessages,
    interactionId,
    initialDetails,
    initialCountryCode,
}: {
    previewDetails?: InteractionDetails;
    previewMessages?: { success?: string; error?: string; info?: string };
    interactionId?: string;
    initialDetails?: InteractionDetails;
    initialCountryCode?: string;
}) {
    const resolvedInteractionId = interactionId || '';
    const isPreview = !!previewDetails;

    const [fetchedDetails, setFetchedDetails] = useState<InteractionDetails | null>(initialDetails ?? null);
    const details = previewDetails ?? fetchedDetails;
    const [method, setMethod] = useState<LoginMethod | null>(null);
    const [otpMethod, setOtpMethod] = useState<'phone' | 'email'>('email');
    const [step, setStep] = useState<Step>('choose');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [countryCode, setCountryCode] = useAutoCountryCode(initialCountryCode || '+1');
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [timer, setTimer] = useState(120);
    const [canResend, setCanResend] = useState(false);
    const [isNotFound, setIsNotFound] = useState(false);

    // Registration states
    const [regFirstName, setRegFirstName] = useState('');
    const [regLastName, setRegLastName] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regPhone, setRegPhone] = useState('');
    const [regWalletAddress, setRegWalletAddress] = useState<string>('');
    const [regWalletSignature, setRegWalletSignature] = useState<string>('');
    const [regCountryCode, setRegCountryCode] = useState(initialCountryCode || '+1');
    const [regCountryCodeTouched, setRegCountryCodeTouched] = useState(false);

    useEffect(() => {
        if (regCountryCodeTouched) return;
        setRegCountryCode(countryCode);
    }, [countryCode, regCountryCodeTouched]);

    const branding = details?.branding || {};
    const locale: Locale = (branding.locale || 'en') as Locale;
    const localeNorm = String(locale || 'en').trim().toLowerCase();
    const baseLocale: BaseLocale = localeNorm.startsWith('es') ? 'es' : 'en';

    const rawMessages = branding.messages as NonNullable<InteractionDetails['branding']>['messages'] | undefined;
    const messageLocales = ((rawMessages as any)?.locales || {}) as Record<string, Record<string, string>>;
    const messageStyles = ((rawMessages as any)?.styles || {}) as NonNullable<NonNullable<InteractionDetails['branding']>['messages']>['styles'];

    const msg = (key: string, vars?: Record<string, string>) => {
        const fromLocale =
            messageLocales?.[locale]?.[key] ??
            (locale !== baseLocale ? messageLocales?.[baseLocale]?.[key] : undefined);
        const fromLegacy = (rawMessages as any)?.[key];
        const fallback = DEFAULT_MESSAGES[baseLocale]?.[key] ?? DEFAULT_MESSAGES.en[key] ?? '';
        const template = (fromLocale || fromLegacy || fallback) as string;
        return interpolate(template, vars);
    };

    const ui = (key: string, vars?: Record<string, string>) => {
        const template =
            (branding as any)?.ui?.locales?.[locale]?.[key] ??
            (locale !== baseLocale ? (branding as any)?.ui?.locales?.[baseLocale]?.[key] : undefined) ??
            DEFAULT_UI[baseLocale]?.[key] ??
            DEFAULT_UI.en[key] ??
            key;
        return interpolate(template, vars);
    };

    // If branding persisted the English defaults as overrides, do not let that block localization.
    const localizedOverride = (value: string | undefined, uiKey: string, vars?: Record<string, string>) => {
        const v = (value || '').trim();
        if (!v) return undefined;
        const enTemplate = (DEFAULT_UI.en as any)?.[uiKey];
        const enDefault = typeof enTemplate === 'string' ? interpolate(enTemplate, vars) : undefined;
        if (baseLocale !== 'en' && typeof enDefault === 'string' && v === enDefault) return undefined;
        return value;
    };
    const colors = branding.colors || {};
    const authCards = branding.authCards || {};
    const loginContainer = branding.loginContainer || {};
    const footerText =
        branding.footerTextEnabled
            ? (localizedOverride(branding.footerText, 'poweredByZKey') || ui('poweredByZKey'))
            : ui('poweredByZKey');

    const logoScale = branding.logoScale ?? 1;
    const logoHeight = (basePx: number) => `${Math.max(1, Math.round(basePx * logoScale))}px`;

    const auth = details?.authMethods ?? {
        password: true,
        emailOtp: true,
        smsOtp: true,
        wallet: true,
    };

    const registrationOtpMode: 'both' | 'email' | 'sms' = (() => {
        const v = (auth as any)?.registrationOtp;
        if (v === 'email' || v === 'sms' || v === 'both') return v;
        if (auth.emailOtp && auth.smsOtp) return 'both';
        return auth.emailOtp ? 'email' : 'sms';
    })();

    const regEmailOtpEnabled = !!auth.emailOtp && (registrationOtpMode === 'both' || registrationOtpMode === 'email');
    const regSmsOtpEnabled = !!auth.smsOtp && (registrationOtpMode === 'both' || registrationOtpMode === 'sms');

    const getAuthCard = (key: AuthCardKey, fallback: { title: string; subtitle: string }) => {
        const card = authCards?.[key] || {};

        const titleKey =
            key === 'password'
                ? 'authPasswordTitle'
                : key === 'emailOtp'
                    ? 'authEmailTitle'
                    : key === 'smsOtp'
                        ? 'authSmsTitle'
                        : 'authWalletTitle';
        const subtitleKey =
            key === 'password'
                ? 'authPasswordSubtitle'
                : key === 'emailOtp'
                    ? 'authEmailSubtitle'
                    : key === 'smsOtp'
                        ? 'authSmsSubtitle'
                        : 'authWalletSubtitle';

        return {
            title: localizedOverride(card.title, titleKey) || fallback.title,
            subtitle: localizedOverride(card.subtitle, subtitleKey) || fallback.subtitle,
            titleColor: card.colors?.title,
            subtitleColor: card.colors?.subtitle,
            backgroundColor: card.backgroundColor,
            borderColor: card.borderColor,
            hoverBackgroundColor: card.hoverBackgroundColor,
            hoverBorderColor: card.hoverBorderColor,
            hoverOverlayColor: card.hoverOverlayColor,
            iconColor: card.iconColor,
            iconHoverColor: card.iconHoverColor,
            iconBackgroundColor: card.iconBackgroundColor,
            arrowColor: card.arrowColor,
            arrowHoverColor: card.arrowHoverColor,
        };
    };

    const loginContainerStyle: CSSProperties = {
        ...(loginContainer.backgroundColor ? { backgroundColor: loginContainer.backgroundColor } : {}),
        ...(loginContainer.borderColor ? { borderColor: loginContainer.borderColor } : {}),
    };

    const parseColorToRgb = (value: string | undefined | null): { r: number; g: number; b: number } | null => {
        if (!value) return null;
        const v = value.trim();

        const hex3 = /^#([0-9a-fA-F]{3})$/;
        const hex6 = /^#([0-9a-fA-F]{6})$/;
        const hex8 = /^#([0-9a-fA-F]{8})$/;
        const rgb = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/;
        const rgba = /^rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(0|1|0?\.\d+)\s*\)$/;

        const clamp = (n: number) => Math.min(255, Math.max(0, n));

        let m = v.match(hex3);
        if (m) {
            const h = m[1];
            return {
                r: parseInt(h[0] + h[0], 16),
                g: parseInt(h[1] + h[1], 16),
                b: parseInt(h[2] + h[2], 16),
            };
        }

        m = v.match(hex6);
        if (m) {
            const h = m[1];
            return {
                r: parseInt(h.slice(0, 2), 16),
                g: parseInt(h.slice(2, 4), 16),
                b: parseInt(h.slice(4, 6), 16),
            };
        }

        m = v.match(hex8);
        if (m) {
            const h = m[1];
            return {
                r: parseInt(h.slice(0, 2), 16),
                g: parseInt(h.slice(2, 4), 16),
                b: parseInt(h.slice(4, 6), 16),
            };
        }

        m = v.match(rgb);
        if (m) {
            return {
                r: clamp(parseInt(m[1], 10)),
                g: clamp(parseInt(m[2], 10)),
                b: clamp(parseInt(m[3], 10)),
            };
        }

        m = v.match(rgba);
        if (m) {
            return {
                r: clamp(parseInt(m[1], 10)),
                g: clamp(parseInt(m[2], 10)),
                b: clamp(parseInt(m[3], 10)),
            };
        }

        return null;
    };

    const isLightColor = (value: string | undefined | null) => {
        const rgb = parseColorToRgb(value);
        if (!rgb) return false;
        const yiq = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
        return yiq >= 180;
    };

    const prefersLight =
        typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-color-scheme: light)').matches;

    const isLightThemeFromBranding =
        isLightColor(branding.backgroundColor || '#0a0f1e') || isLightColor(loginContainer.backgroundColor);

    const isLightTheme = details ? isLightThemeFromBranding : prefersLight;

    const fallbackTitleColor = isLightTheme ? '#0f172a' : '#ffffff';
    const fallbackSubtitleColor = isLightTheme ? '#475569' : '#94a3b8';
    const titleColor = colors.title || fallbackTitleColor;
    const subtitleColor = colors.subtitle || fallbackSubtitleColor;

    const toHex6 = (value: string | undefined | null, fallback: string) => {
        const v = (value || '').trim();
        const hex3 = /^#([0-9a-fA-F]{3})$/;
        const hex6 = /^#([0-9a-fA-F]{6})$/;
        const hex8 = /^#([0-9a-fA-F]{8})$/;

        let m = v.match(hex3);
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

    const primaryHex6 = toHex6(details?.primaryColor, '#d4af37');
    const primaryLightHex8 = `${primaryHex6}20`;
    const primaryHoverHex8 = `${primaryHex6}E6`;
    const primaryDisabledHex8 = `${primaryHex6}66`;

    const invertLogo = ((branding as any).invertLogo ?? details?.invertLogo) === true;

    const controls = branding.controls || {};
    const inputControls = controls.input || {};
    const primaryButtonControls = controls.primaryButton || {};
    const selectControls = controls.select || {};
    const primaryButtonLabels = primaryButtonControls.labels || {};
    const secondaryLinkControls = controls.secondaryLink || {};
    const loadingControls = controls.loading || {};

    const defaultInputBg = isLightTheme ? '#ffffff' : 'rgba(255, 255, 255, 0.05)';
    const defaultInputBorder = isLightTheme ? '#e2e8f0' : 'rgba(255, 255, 255, 0.1)';
    const defaultInputText = isLightTheme ? '#0f172a' : '#ffffff';
    const defaultInputPlaceholder = isLightTheme ? '#94a3b8' : 'rgba(148, 163, 184, 0.5)';
    const defaultInputHoverBg = isLightTheme ? '#f8fafc' : 'rgba(255, 255, 255, 0.08)';
    const defaultInputHoverBorder = isLightTheme ? '#cbd5e1' : 'rgba(255, 255, 255, 0.18)';
    const defaultInputDisabledBg = isLightTheme ? '#f1f5f9' : 'rgba(255, 255, 255, 0.03)';
    const defaultInputDisabledBorder = isLightTheme ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)';
    const defaultInputDisabledText = isLightTheme ? '#94a3b8' : 'rgba(148, 163, 184, 0.8)';
    const defaultInputErrorBorder = '#ef4444';
    const defaultSelectMenuBg = isLightTheme ? '#ffffff' : 'rgba(10, 25, 47, 0.95)';
    const defaultSelectItemSubtext = isLightTheme ? '#64748b' : '#94A3B8';
    const defaultSelectTriggerHoverBg = isLightTheme ? '#f8fafc' : 'rgba(255, 255, 255, 0.1)';
    const defaultSelectItemHoverBg = isLightTheme ? '#f1f5f9' : 'rgba(255, 255, 255, 0.1)';
    const defaultBtnBorder = 'transparent';
    const defaultBtnDisabledBg = primaryDisabledHex8;
    const defaultBtnDisabledText = isLightTheme ? '#0f172a' : '#ffffff';
    const defaultSecondaryText = isLightTheme ? '#475569' : '#94a3b8';
    const defaultSecondaryHoverText = isLightTheme ? '#0f172a' : '#ffffff';
    const defaultSpinner = isLightTheme ? '#0f172a' : '#ffffff';
    const defaultLoadingBg = isLightTheme ? '#ffffff' : '#0A192FCC';
    const defaultLoadingBorder = isLightTheme ? '#e2e8f0' : '#FFFFFF1A';

    const loadingContainerStyle: CSSProperties = {
        backgroundColor: loadingControls.backgroundColor || defaultLoadingBg,
        borderColor: loadingControls.borderColor || defaultLoadingBorder,
    };

    const feedbackDefaults = {
        success: {
            textColor: isLightTheme ? '#166534' : '#86efac',
            backgroundColor: isLightTheme ? '#dcfce7' : 'rgba(22, 101, 52, 0.15)',
            borderColor: isLightTheme ? '#86efac' : 'rgba(134, 239, 172, 0.35)',
        },
        error: {
            textColor: isLightTheme ? '#b91c1c' : '#fca5a5',
            backgroundColor: isLightTheme ? '#fee2e2' : 'rgba(185, 28, 28, 0.15)',
            borderColor: isLightTheme ? '#fca5a5' : 'rgba(252, 165, 165, 0.35)',
        },
        info: {
            textColor: isLightTheme ? '#0f172a' : '#e2e8f0',
            backgroundColor: isLightTheme ? '#eff6ff' : 'rgba(59, 130, 246, 0.12)',
            borderColor: isLightTheme ? '#bfdbfe' : 'rgba(191, 219, 254, 0.25)',
        },
    } as const;

    const FeedbackMessage = ({ kind, text }: { kind: 'success' | 'error' | 'info'; text: string }) => {
        const d = feedbackDefaults[kind];
        const style: CSSProperties = {
            color:
                (kind === 'success' ? messageStyles?.successTextColor : kind === 'error' ? messageStyles?.errorTextColor : messageStyles?.infoTextColor) ||
                d.textColor,
            backgroundColor:
                (kind === 'success' ? messageStyles?.successBackgroundColor : kind === 'error' ? messageStyles?.errorBackgroundColor : messageStyles?.infoBackgroundColor) ||
                d.backgroundColor,
            borderColor:
                (kind === 'success' ? messageStyles?.successBorderColor : kind === 'error' ? messageStyles?.errorBorderColor : messageStyles?.infoBorderColor) ||
                d.borderColor,
        };
        return (
            <div className="text-sm text-center rounded-xl border px-4 py-3" style={style}>
                {text}
            </div>
        );
    };

    const zkeyCssVars = {
        // Buttons
        '--zkey-btn-primary': primaryButtonControls.backgroundColor || 'var(--brand-primary)',
        '--zkey-btn-primary-hover': primaryButtonControls.hoverBackgroundColor || primaryHoverHex8,
        '--zkey-btn-primary-text': primaryButtonControls.textColor || '#0A192F',
        '--zkey-btn-primary-text-hover': primaryButtonControls.hoverTextColor || 'var(--zkey-btn-primary-text)',
        '--zkey-btn-primary-border': primaryButtonControls.borderColor || defaultBtnBorder,
        '--zkey-btn-primary-border-hover': primaryButtonControls.hoverBorderColor || 'var(--zkey-btn-primary-border)',
        '--zkey-btn-primary-disabled': primaryButtonControls.disabledBackgroundColor || defaultBtnDisabledBg,
        '--zkey-btn-primary-text-disabled': primaryButtonControls.disabledTextColor || defaultBtnDisabledText,
        '--zkey-btn-primary-border-disabled': primaryButtonControls.disabledBorderColor || 'var(--zkey-btn-primary-border)',

        // Secondary link buttons
        '--zkey-link-secondary': secondaryLinkControls.textColor || defaultSecondaryText,
        '--zkey-link-secondary-hover': secondaryLinkControls.hoverTextColor || defaultSecondaryHoverText,

        // Loading
        '--zkey-spinner': loadingControls.spinnerColor || defaultSpinner,
        '--zkey-spinner-on-primary': loadingControls.spinnerOnPrimaryColor || 'var(--zkey-btn-primary-text-disabled)',

        // Inputs
        '--zkey-input-bg': inputControls.backgroundColor || defaultInputBg,
        '--zkey-input-border': inputControls.borderColor || defaultInputBorder,
        '--zkey-input-text': inputControls.textColor || defaultInputText,
        '--zkey-input-placeholder': inputControls.placeholderColor || defaultInputPlaceholder,
        '--zkey-input-hover-bg': inputControls.hoverBackgroundColor || defaultInputHoverBg,
        '--zkey-input-hover-border': inputControls.hoverBorderColor || defaultInputHoverBorder,
        '--zkey-input-focus-border': inputControls.focusBorderColor || 'var(--brand-primary)',
        '--zkey-input-disabled-bg': inputControls.disabledBackgroundColor || defaultInputDisabledBg,
        '--zkey-input-disabled-border': inputControls.disabledBorderColor || defaultInputDisabledBorder,
        '--zkey-input-disabled-text': inputControls.disabledTextColor || defaultInputDisabledText,
        '--zkey-input-error-border': inputControls.errorBorderColor || defaultInputErrorBorder,

        // Select / dropdown
        '--zkey-select-trigger-bg': selectControls.triggerBackgroundColor || 'var(--zkey-input-bg)',
        '--zkey-select-trigger-hover-bg': selectControls.triggerHoverBackgroundColor || defaultSelectTriggerHoverBg,
        '--zkey-select-trigger-border': selectControls.triggerBorderColor || 'var(--zkey-input-border)',
        '--zkey-select-trigger-text': selectControls.triggerTextColor || 'var(--zkey-input-text)',
        '--zkey-select-menu-bg': selectControls.menuBackgroundColor || defaultSelectMenuBg,
        '--zkey-select-menu-border': selectControls.menuBorderColor || 'var(--zkey-input-border)',
        '--zkey-select-item-hover-bg': selectControls.itemHoverBackgroundColor || defaultSelectItemHoverBg,
        '--zkey-select-item-active-bg': selectControls.itemActiveBackgroundColor || 'var(--brand-primary-light)',
        '--zkey-select-item-text': selectControls.itemTextColor || 'var(--zkey-input-text)',
        '--zkey-select-item-subtext': selectControls.itemSubtextColor || defaultSelectItemSubtext,
    } as const;

    const containerClassName = isLightTheme
        ? 'rounded-3xl p-8 border border-slate-200 bg-white'
        : 'glass rounded-3xl p-8 border border-white/10';

    const authCardClassName = 'w-full flex items-center gap-4 p-4 rounded-xl border transition-colors group text-left zkey-auth-card';

    const defaultAuthCardBg = isLightTheme ? '#ffffff' : 'rgba(255, 255, 255, 0.05)';
    const defaultAuthCardBorder = isLightTheme ? '#e2e8f0' : 'rgba(255, 255, 255, 0.1)';
    const defaultAuthCardHoverBg = isLightTheme ? '#f8fafc' : 'rgba(255, 255, 255, 0.08)';
    const defaultAuthCardHoverBorder = isLightTheme ? '#cbd5e1' : 'rgba(255, 255, 255, 0.18)';
    const defaultAuthCardHoverOverlay = isLightTheme ? `${primaryHex6}14` : '#FFFFFF0D';

    const inputClassName = 'w-full pl-12 pr-4 py-3 rounded-xl border focus:outline-none zkey-input';
    const inputClassNameNoIcon = 'w-full pl-4 pr-4 py-3 rounded-xl border focus:outline-none zkey-input';
    const inputClassNamePlain = 'w-full px-4 py-3 rounded-xl border focus:outline-none zkey-input';
    const inputClassNamePhone = 'w-full pl-12 pr-4 py-3 rounded-xl border focus:outline-none zkey-input h-full';
    const otpClassName = 'w-full text-center text-3xl font-mono tracking-[0.5em] py-4 rounded-xl border focus:outline-none zkey-input';

    useEffect(() => {
        if (isPreview) return;
        const bg = branding.backgroundColor || '#0a0f1e';
        document.documentElement.style.setProperty('--background', bg);
        document.body.style.backgroundColor = bg;
        document.body.style.background = bg;
        return () => {
            document.documentElement.style.removeProperty('--background');
            document.body.style.removeProperty('background-color');
            document.body.style.removeProperty('background');
        };
    }, [branding.backgroundColor, isPreview]);

    useEffect(() => {
        if (!details) return;
        if (otpMethod === 'phone' && !auth.smsOtp && auth.emailOtp) setOtpMethod('email');
        if (otpMethod === 'email' && !auth.emailOtp && auth.smsOtp) setOtpMethod('phone');
    }, [details, auth.emailOtp, auth.smsOtp, otpMethod]);

    useEffect(() => {
        if (step !== 'register') return;
        // Only set default if current otpMethod is not allowed in registration
        const currentAllowed = (otpMethod === 'email' && regEmailOtpEnabled) || (otpMethod === 'phone' && regSmsOtpEnabled);
        if (!currentAllowed) {
            if (regEmailOtpEnabled) {
                setOtpMethod('email');
            } else if (regSmsOtpEnabled) {
                setOtpMethod('phone');
            }
        }
    }, [step, regEmailOtpEnabled, regSmsOtpEnabled, otpMethod]);

    useEffect(() => {
        if (isPreview) return;
        if (!resolvedInteractionId) return;
        if (fetchedDetails) return;
        // Fetch interaction details
        getInteractionDetails(resolvedInteractionId)
            .then(setFetchedDetails)
            .catch(() => {
                setSuccess('');
                const locales = ((rawMessages as any)?.locales || {}) as Record<string, Record<string, string>>;
                const invalidSessionText =
                    (locales?.[locale]?.invalidSession as string | undefined) ||
                    ((rawMessages as any)?.invalidSession as string | undefined) ||
                    DEFAULT_MESSAGES[baseLocale]?.invalidSession ||
                    DEFAULT_MESSAGES.en.invalidSession;

                setError(invalidSessionText);
            });
    }, [resolvedInteractionId, isPreview, fetchedDetails, locale, baseLocale, rawMessages]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (step === 'verify' && timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        } else if (timer === 0) {
            setCanResend(true);
        }
        return () => clearInterval(interval);
    }, [step, timer]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const startTimer = () => {
        setTimer(120);
        setCanResend(false);
    };

    const handleRequestOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isPreview) {
            setError('');
            setSuccess(msg('otpSent'));
            setIsNotFound(false);
            setStep('verify');
            startTimer();
            return;
        }
        setError('');
        setSuccess('');
        setIsNotFound(false);
        setIsLoading(true);
        try {
            const fullIdentifier = method === 'phone' ? `${countryCode}${identifier}` : identifier;
            const result = await requestOtpAction(fullIdentifier, method as 'phone' | 'email', resolvedInteractionId);

            if (!result.success) {
                if (result.statusCode === 404 || (result.error && result.error.includes('not found'))) {
                    setIsNotFound(true);
                } else {
                    const m = result.error || msg('otpSendFailed');
                    setError(m);
                }
                return;
            }

            setSuccess(msg('otpSent'));
            setStep('verify');
            startTimer();
        } catch (err: any) {
            setError(err?.message || msg('unexpectedError'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async (e?: React.FormEvent | React.ChangeEvent, otpValue?: string) => {
        if (e) e.preventDefault();
        const codeToVerify = otpValue || otp;
        if (codeToVerify.length !== 6) return;

        if (isPreview) {
            setError('');
            setSuccess('');
            setIsLoading(false);
            return;
        }

        setError('');
        setSuccess('');
        setIsLoading(true);
        try {
            const fullIdentifier = method === 'phone' ? `${countryCode}${identifier}` : identifier;
            const result = await loginWithOtpAction(resolvedInteractionId, fullIdentifier, codeToVerify);

            if (!result.success) {
                const m = result.error || msg('verificationFailed');
                setError(m);
                return;
            }

            // Redirect to client app
            window.location.href = result.data.redirectUri;
        } catch (err: any) {
            setError(err?.message || msg('verificationFailed'));
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isPreview) {
            setError('');
            setSuccess('');
            return;
        }
        setError('');
        setSuccess('');
        setIsLoading(true);
        try {
            const result = await loginWithPasswordAction(resolvedInteractionId, identifier, password);

            if (!result.success) {
                const m = result.error || msg('loginFailed');
                setError(m);
                return;
            }

            window.location.href = result.data.redirectUri;
        } catch (err: any) {
            setError(err?.message || msg('loginFailed'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isPreview) {
            setError('');
            setSuccess(msg('otpSent'));

            const verifyMethod: 'phone' | 'email' = otpMethod;
            if (verifyMethod === 'phone') {
                setMethod('phone');
                setCountryCode(regCountryCode);
                setIdentifier(regPhone);
            } else {
                setMethod('email');
                setIdentifier(regEmail);
            }

            setStep('verify');
            startTimer();
            return;
        }
        setError('');
        setSuccess('');
        setIsLoading(true);
        try {
            const fullPhone = `${regCountryCode}${regPhone}`;
            const result = await registerAction(
                resolvedInteractionId,
                regEmail,
                regFirstName,
                regLastName,
                fullPhone,
                regWalletAddress,
                regWalletSignature,
            );

            if (!result.success) {
                setError(result.error || msg('registrationFailed'));
                return;
            }

            // After registration, enforce OTP verification before completing login.
            // Use the currently selected OTP channel (SMS/Email), defaulting to SMS.
            const verifyMethod: 'phone' | 'email' = otpMethod;

            // Set up the existing OTP verify UI state
            if (verifyMethod === 'phone') {
                setMethod('phone');
                setCountryCode(regCountryCode);
                setIdentifier(regPhone);
            } else {
                setMethod('email');
                setIdentifier(regEmail);
            }

            const otpIdentifier = verifyMethod === 'phone' ? fullPhone : regEmail;
            const otpResult = await requestOtpAction(otpIdentifier, verifyMethod, resolvedInteractionId);

            if (!otpResult.success) {
                const m = otpResult.error || msg('otpSendFailed');
                setError(m);
                return;
            }

            setSuccess(msg('otpSent'));
            setStep('verify');
            startTimer();
        } catch (err: any) {
            setError(err?.message || msg('registrationFailed'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleWalletLogin = async (address: string, signature: string) => {
        if (isPreview) {
            setError('');
            setSuccess('');
            return;
        }
        setError('');
        setSuccess('');
        setIsLoading(true);
        try {
            const result = await loginWithWalletAction(resolvedInteractionId, address, signature);

            if (!result.success) {
                if (result.statusCode === 404) {
                    setRegWalletAddress(address); setRegWalletSignature(signature);
                    setStep('register');
                    return;
                }

                const m = result.error || msg('walletLoginFailed');
                setError(m);
                return;
            }

            // Redirect to client app
            window.location.href = result.data.redirectUri;
        } catch (err: any) {
            setError(err?.message || msg('walletLoginFailed'));
        } finally {
            setIsLoading(false);
        }
    };

    const primaryColor = primaryHex6; // Default to ZKey Gold

    return (
        <div
            className="w-full max-w-md mx-auto zkey-auth"
            style={{
                //@ts-ignore
                '--brand-primary': primaryColor,
                '--brand-primary-light': primaryLightHex8,
                //@ts-ignore
                ...zkeyCssVars,
            }}
        >
            <style jsx global>{`
                .bg-brand-gold { background-color: var(--brand-primary) !important; }
                .text-brand-gold { color: var(--brand-primary) !important; }
                .bg-brand-gold\/10 { background-color: var(--brand-primary-light) !important; }
                .border-brand-gold { border-color: var(--brand-primary) !important; }
                .focus\:border-brand-gold:focus { border-color: var(--brand-primary) !important; }
                .group-hover\:text-brand-gold:hover { color: var(--brand-primary) !important; }

                .zkey-auth .zkey-primary-btn {
                    background-color: var(--zkey-btn-primary) !important;
                    color: var(--zkey-btn-primary-text) !important;
                    border: 1px solid var(--zkey-btn-primary-border) !important;
                }

                .zkey-auth .zkey-primary-btn:hover {
                    background-color: var(--zkey-btn-primary-hover) !important;
                    border-color: var(--zkey-btn-primary-border-hover) !important;
                    color: var(--zkey-btn-primary-text-hover) !important;
                }

                .zkey-auth .zkey-primary-btn:disabled {
                    background-color: var(--zkey-btn-primary-disabled) !important;
                    color: var(--zkey-btn-primary-text-disabled) !important;
                    border-color: var(--zkey-btn-primary-border-disabled) !important;
                }

                .zkey-auth .zkey-input {
                    background-color: var(--zkey-input-bg) !important;
                    border-color: var(--zkey-input-border) !important;
                    color: var(--zkey-input-text) !important;
                }

                .zkey-auth .zkey-input:hover {
                    background-color: var(--zkey-input-hover-bg) !important;
                    border-color: var(--zkey-input-hover-border) !important;
                }

                .zkey-auth .zkey-input::placeholder {
                    color: var(--zkey-input-placeholder) !important;
                    opacity: 1;
                }

                .zkey-auth .zkey-input:focus {
                    border-color: var(--zkey-input-focus-border) !important;
                    outline: none;
                }

                .zkey-auth .zkey-input:disabled {
                    background-color: var(--zkey-input-disabled-bg) !important;
                    border-color: var(--zkey-input-disabled-border) !important;
                    color: var(--zkey-input-disabled-text) !important;
                }

                .zkey-auth .zkey-input[aria-invalid="true"] {
                    border-color: var(--zkey-input-error-border) !important;
                }

                .zkey-auth .zkey-secondary-link {
                    color: var(--zkey-link-secondary) !important;
                }

                .zkey-auth .zkey-secondary-link:hover {
                    color: var(--zkey-link-secondary-hover) !important;
                }

                .zkey-auth .zkey-spinner {
                    color: var(--zkey-spinner) !important;
                }

                .zkey-auth .zkey-spinner--on-primary {
                    color: var(--zkey-spinner-on-primary) !important;
                }

                .zkey-auth .zkey-auth-card {
                    background-color: var(--card-bg) !important;
                    border-color: var(--card-border) !important;
                    position: relative;
                    overflow: hidden;
                }

                .zkey-auth .zkey-auth-card::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background-color: var(--card-hover-overlay);
                    opacity: 0;
                    transition: opacity 150ms ease;
                    pointer-events: none;
                }

                .zkey-auth .zkey-auth-card:hover {
                    background-color: var(--card-hover-bg, var(--card-bg)) !important;
                    border-color: var(--card-hover-border, var(--card-border)) !important;
                }

                .zkey-auth .zkey-auth-card:hover::after {
                    opacity: 1;
                }

                .zkey-auth .zkey-select-trigger:hover {
                    background-color: var(--zkey-select-trigger-hover-bg) !important;
                }

                .zkey-auth .zkey-select-item:hover {
                    background-color: var(--zkey-select-item-hover-bg) !important;
                }

                .zkey-auth .zkey-select-item--active {
                    background-color: var(--zkey-select-item-active-bg) !important;
                }

                ${isPreview ? '' : `
                :root {
                    --background: ${branding.backgroundColor || '#0a0f1e'} !important;
                }

                html, body {
                    background: var(--background) !important;
                    background-color: var(--background) !important;
                    transition: background-color 0.5s ease, background 0.5s ease;
                }
                `}
            `}</style>
            {!details ? (
                <div className="rounded-3xl p-8 border" style={loadingContainerStyle}>
                    <div className="flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin zkey-spinner" />
                    </div>
                </div>
            ) : (
                <AnimatePresence mode="wait">
                    {/* Step 1: Choose Login Method */}
                    {step === 'choose' && (
                        <motion.div
                            key="choose"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className={containerClassName}
                            style={loginContainerStyle}
                        >
                            <div className="text-center mb-8">
                                {details.logo && (
                                    <div className="mb-6 flex justify-center">
                                        <img
                                            src={details.logo.startsWith('http') || details.logo.startsWith('data:') ? details.logo : `https://avatar.vercel.sh/${details.logo}.svg`}
                                            alt={details.clientName}
                                            className={`w-auto object-contain ${invertLogo ? 'invert' : ''}`}
                                            style={{ height: logoHeight(64) }}
                                        />
                                    </div>
                                )}
                                <h1 className="text-2xl font-bold mb-2" style={{ color: titleColor }}>
                                    {localizedOverride(branding.loginTitle, 'loginTitle', { clientName: details.clientName }) || ui('loginTitle', { clientName: details.clientName })}
                                </h1>
                                <p className="text-sm mb-4 italic" style={{ color: subtitleColor }}>
                                    {localizedOverride(branding.loginSubtitle, 'loginSubtitle', { clientName: details.clientName }) || ui('loginSubtitle', { clientName: details.clientName }) || details.clientDescription}
                                </p>
                            </div>

                            {isPreview && previewMessages && (
                                <div className="space-y-2 mb-6">
                                    {previewMessages.success && <FeedbackMessage kind="success" text={previewMessages.success} />}
                                    {previewMessages.error && <FeedbackMessage kind="error" text={previewMessages.error} />}
                                    {previewMessages.info && <FeedbackMessage kind="info" text={previewMessages.info} />}
                                </div>
                            )}

                            <div className="space-y-4">
                                {auth.password && (
                                    <button
                                        onClick={() => {
                                            setMethod('password');
                                            setStep('input');
                                        }}
                                        className={authCardClassName}
                                        style={(() => {
                                            const card = getAuthCard('password', { title: ui('authPasswordTitle'), subtitle: ui('authPasswordSubtitle') });
                                            return {
                                                ['--card-bg' as any]: card.backgroundColor || defaultAuthCardBg,
                                                ['--card-border' as any]: card.borderColor || defaultAuthCardBorder,
                                                ['--card-hover-bg' as any]: card.hoverBackgroundColor || defaultAuthCardHoverBg,
                                                ['--card-hover-border' as any]: card.hoverBorderColor || defaultAuthCardHoverBorder,
                                                ['--card-hover-overlay' as any]: card.hoverOverlayColor || defaultAuthCardHoverOverlay,
                                                ['--card-icon' as any]: card.iconColor || 'var(--brand-primary)',
                                                ['--card-icon-hover' as any]: card.iconHoverColor || 'var(--brand-primary)',
                                                ['--card-arrow' as any]: card.arrowColor || colors.subtitle || '#94a3b8',
                                                ['--card-arrow-hover' as any]: card.arrowHoverColor || 'var(--brand-primary)',
                                            };
                                        })() as any}
                                    >
                                        {(() => {
                                            const card = getAuthCard('password', { title: ui('authPasswordTitle'), subtitle: ui('authPasswordSubtitle') });
                                            return (
                                                <div
                                                    className="w-12 h-12 rounded-xl bg-brand-gold/10 flex items-center justify-center shrink-0"
                                                    style={card.iconBackgroundColor ? { backgroundColor: card.iconBackgroundColor } : undefined}
                                                >
                                                    <User className="w-6 h-6 text-[color:var(--card-icon)] group-hover:text-[color:var(--card-icon-hover)] transition-colors" />
                                                </div>
                                            );
                                        })()}
                                        <div className="flex-1">
                                            {(() => {
                                                const card = getAuthCard('password', { title: ui('authPasswordTitle'), subtitle: ui('authPasswordSubtitle') });
                                                return (
                                                    <>
                                                        <p className="text-white font-bold" style={{ color: card.titleColor || undefined }}>{card.title}</p>
                                                        <p className="text-brand-slate text-sm" style={{ color: card.subtitleColor || undefined }}>{card.subtitle}</p>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-[color:var(--card-arrow)] group-hover:text-[color:var(--card-arrow-hover)] transition-colors shrink-0" />
                                    </button>
                                )}

                                {auth.emailOtp && (
                                    <button
                                        onClick={() => {
                                            setOtpMethod('email');
                                            setMethod('email');
                                            setStep('input');
                                        }}
                                        className={authCardClassName}
                                        style={(() => {
                                            const card = getAuthCard('emailOtp', { title: ui('authEmailTitle'), subtitle: ui('authEmailSubtitle') });
                                            return {
                                                ['--card-bg' as any]: card.backgroundColor || defaultAuthCardBg,
                                                ['--card-border' as any]: card.borderColor || defaultAuthCardBorder,
                                                ['--card-hover-bg' as any]: card.hoverBackgroundColor || defaultAuthCardHoverBg,
                                                ['--card-hover-border' as any]: card.hoverBorderColor || defaultAuthCardHoverBorder,
                                                ['--card-hover-overlay' as any]: card.hoverOverlayColor || defaultAuthCardHoverOverlay,
                                                ['--card-icon' as any]: card.iconColor || 'var(--brand-primary)',
                                                ['--card-icon-hover' as any]: card.iconHoverColor || 'var(--brand-primary)',
                                                ['--card-arrow' as any]: card.arrowColor || colors.subtitle || '#94a3b8',
                                                ['--card-arrow-hover' as any]: card.arrowHoverColor || 'var(--brand-primary)',
                                            };
                                        })() as any}
                                    >
                                        {(() => {
                                            const card = getAuthCard('emailOtp', { title: ui('authEmailTitle'), subtitle: ui('authEmailSubtitle') });
                                            return (
                                                <div
                                                    className="w-12 h-12 rounded-xl bg-brand-gold/10 flex items-center justify-center shrink-0"
                                                    style={card.iconBackgroundColor ? { backgroundColor: card.iconBackgroundColor } : undefined}
                                                >
                                                    <Mail className="w-6 h-6 text-[color:var(--card-icon)] group-hover:text-[color:var(--card-icon-hover)] transition-colors" />
                                                </div>
                                            );
                                        })()}
                                        <div className="flex-1">
                                            {(() => {
                                                const card = getAuthCard('emailOtp', { title: ui('authEmailTitle'), subtitle: ui('authEmailSubtitle') });
                                                return (
                                                    <>
                                                        <p className="text-white font-bold" style={{ color: card.titleColor || undefined }}>{card.title}</p>
                                                        <p className="text-brand-slate text-sm" style={{ color: card.subtitleColor || undefined }}>{card.subtitle}</p>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-[color:var(--card-arrow)] group-hover:text-[color:var(--card-arrow-hover)] transition-colors shrink-0" />
                                    </button>
                                )}

                                {auth.smsOtp && (
                                    <button
                                        onClick={() => {
                                            setOtpMethod('phone');
                                            setMethod('phone');
                                            setStep('input');
                                        }}
                                        className={authCardClassName}
                                        style={(() => {
                                            const card = getAuthCard('smsOtp', { title: ui('authSmsTitle'), subtitle: ui('authSmsSubtitle') });
                                            return {
                                                ['--card-bg' as any]: card.backgroundColor || defaultAuthCardBg,
                                                ['--card-border' as any]: card.borderColor || defaultAuthCardBorder,
                                                ['--card-hover-bg' as any]: card.hoverBackgroundColor || defaultAuthCardHoverBg,
                                                ['--card-hover-border' as any]: card.hoverBorderColor || defaultAuthCardHoverBorder,
                                                ['--card-hover-overlay' as any]: card.hoverOverlayColor || defaultAuthCardHoverOverlay,
                                                ['--card-icon' as any]: card.iconColor || 'var(--brand-primary)',
                                                ['--card-icon-hover' as any]: card.iconHoverColor || 'var(--brand-primary)',
                                                ['--card-arrow' as any]: card.arrowColor || colors.subtitle || '#94a3b8',
                                                ['--card-arrow-hover' as any]: card.arrowHoverColor || 'var(--brand-primary)',
                                            };
                                        })() as any}
                                    >
                                        {(() => {
                                            const card = getAuthCard('smsOtp', { title: ui('authSmsTitle'), subtitle: ui('authSmsSubtitle') });
                                            return (
                                                <div
                                                    className="w-12 h-12 rounded-xl bg-brand-gold/10 flex items-center justify-center shrink-0"
                                                    style={card.iconBackgroundColor ? { backgroundColor: card.iconBackgroundColor } : undefined}
                                                >
                                                    <Phone className="w-6 h-6 text-[color:var(--card-icon)] group-hover:text-[color:var(--card-icon-hover)] transition-colors" />
                                                </div>
                                            );
                                        })()}
                                        <div className="flex-1">
                                            {(() => {
                                                const card = getAuthCard('smsOtp', { title: ui('authSmsTitle'), subtitle: ui('authSmsSubtitle') });
                                                return (
                                                    <>
                                                        <p className="text-white font-bold" style={{ color: card.titleColor || undefined }}>{card.title}</p>
                                                        <p className="text-brand-slate text-sm" style={{ color: card.subtitleColor || undefined }}>{card.subtitle}</p>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-[color:var(--card-arrow)] group-hover:text-[color:var(--card-arrow-hover)] transition-colors shrink-0" />
                                    </button>
                                )}

                                {auth.wallet && (
                                    <button
                                        onClick={() => {
                                            setMethod('wallet');
                                            setStep('input');
                                        }}
                                        className={authCardClassName}
                                        style={(() => {
                                            const card = getAuthCard('wallet', { title: ui('authWalletTitle'), subtitle: ui('authWalletSubtitle') });
                                            return {
                                                ['--card-bg' as any]: card.backgroundColor || defaultAuthCardBg,
                                                ['--card-border' as any]: card.borderColor || defaultAuthCardBorder,
                                                ['--card-hover-bg' as any]: card.hoverBackgroundColor || defaultAuthCardHoverBg,
                                                ['--card-hover-border' as any]: card.hoverBorderColor || defaultAuthCardHoverBorder,
                                                ['--card-hover-overlay' as any]: card.hoverOverlayColor || defaultAuthCardHoverOverlay,
                                                ['--card-icon' as any]: card.iconColor || 'var(--brand-primary)',
                                                ['--card-icon-hover' as any]: card.iconHoverColor || 'var(--brand-primary)',
                                                ['--card-arrow' as any]: card.arrowColor || colors.subtitle || '#94a3b8',
                                                ['--card-arrow-hover' as any]: card.arrowHoverColor || 'var(--brand-primary)',
                                            };
                                        })() as any}
                                    >
                                        {(() => {
                                            const card = getAuthCard('wallet', { title: ui('authWalletTitle'), subtitle: ui('authWalletSubtitle') });
                                            return (
                                                <div
                                                    className="w-12 h-12 rounded-xl bg-brand-gold/10 flex items-center justify-center shrink-0"
                                                    style={card.iconBackgroundColor ? { backgroundColor: card.iconBackgroundColor } : undefined}
                                                >
                                                    <Wallet className="w-6 h-6 text-[color:var(--card-icon)] group-hover:text-[color:var(--card-icon-hover)] transition-colors" />
                                                </div>
                                            );
                                        })()}
                                        <div className="flex-1">
                                            {(() => {
                                                const card = getAuthCard('wallet', { title: ui('authWalletTitle'), subtitle: ui('authWalletSubtitle') });
                                                return (
                                                    <>
                                                        <p className="text-white font-bold" style={{ color: card.titleColor || undefined }}>{card.title}</p>
                                                        <p className="text-brand-slate text-sm" style={{ color: card.subtitleColor || undefined }}>{card.subtitle}</p>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-[color:var(--card-arrow)] group-hover:text-[color:var(--card-arrow-hover)] transition-colors shrink-0" />
                                    </button>
                                )}
                            </div>

                            <div className="mt-8 text-center">
                                <button
                                    onClick={() => {
                                        setRegCountryCode(countryCode);
                                        setRegWalletAddress('');
                                        setStep('register');
                                    }}
                                    className="text-brand-slate hover:text-brand-gold text-sm transition-colors"
                                >
                                    {ui('dontHaveAccount')} <span className="font-bold">{ui('signUp')}</span>
                                </button>
                            </div>

                            <p
                                className="mt-6 text-center text-xs opacity-70"
                                style={{ color: colors.footer || undefined }}
                            >
                                {footerText}
                            </p>
                        </motion.div>
                    )}

                    {/* Step 2: Input identifier (Password) */}
                    {step === 'input' && method === 'password' && (
                        <motion.div
                            key="password"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className={containerClassName}
                            style={loginContainerStyle}
                        >
                            <div className="text-center mb-8">
                                {details.logo && (
                                    <div className="mb-6 flex justify-center">
                                        <img
                                            src={details.logo.startsWith('http') || details.logo.startsWith('data:') ? details.logo : `https://avatar.vercel.sh/${details.logo}.svg`}
                                            alt={details.clientName}
                                            className={`w-auto object-contain ${invertLogo ? 'invert' : ''}`}
                                            style={{ height: logoHeight(48) }}
                                        />
                                    </div>
                                )}
                                <h1 className="text-2xl font-bold mb-2" style={{ color: titleColor }}>
                                    {localizedOverride(branding.loginTitle, 'loginTitle', { clientName: details.clientName }) || ui('loginTitle', { clientName: details.clientName })}
                                </h1>
                                <p className="text-sm" style={{ color: subtitleColor }}>
                                    {localizedOverride(branding.loginSubtitle, 'loginSubtitle', { clientName: details.clientName }) || ui('loginSubtitle', { clientName: details.clientName }) || ui('passwordSubtitle')}
                                </p>
                            </div>

                            <form onSubmit={handlePasswordLogin} className="space-y-4">
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-slate" />
                                    <input
                                        type="email"
                                        value={identifier}
                                        onChange={(e) => setIdentifier(e.target.value)}
                                        placeholder={ui('emailPlaceholder')}
                                        required
                                        aria-invalid={!!error}
                                        className={inputClassName}
                                    />
                                </div>

                                <div className="relative">
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder={ui('passwordPlaceholder')}
                                        required
                                        aria-invalid={!!error}
                                        className={inputClassNameNoIcon}
                                    />
                                </div>

                                {success && <FeedbackMessage kind="success" text={success} />}
                                {error && <FeedbackMessage kind="error" text={error} />}

                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full h-14 font-bold rounded-xl zkey-primary-btn"
                                >
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin zkey-spinner--on-primary" /> : (localizedOverride(primaryButtonLabels.signIn, 'signIn') || ui('signIn'))}
                                </Button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setStep('choose');
                                        setMethod(null);
                                        setError('');
                                        setSuccess('');
                                    }}
                                    className="w-full text-sm transition-colors py-2 zkey-secondary-link"
                                >
                                    {ui('backToOptions')}
                                </button>

                                <p className="text-center text-xs opacity-70" style={{ color: colors.footer || undefined }}>
                                    {footerText}
                                </p>
                            </form>
                        </motion.div>
                    )}



                    {/* Step 2: Register */}
                    {step === 'register' && (
                        <motion.div
                            key="register"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className={containerClassName}
                            style={loginContainerStyle}
                        >
                            <div className="text-center mb-8">
                                {details.logo && (
                                    <div className="mb-6 flex justify-center">
                                        <img
                                            src={details.logo.startsWith('http') || details.logo.startsWith('data:') ? details.logo : `https://avatar.vercel.sh/${details.logo}.svg`}
                                            alt={details.clientName}
                                            className={`w-auto object-contain ${invertLogo ? 'invert' : ''}`}
                                            style={{ height: logoHeight(48) }}
                                        />
                                    </div>
                                )}
                                <h1 className="text-2xl font-bold mb-2" style={{ color: titleColor }}>{ui('createAccountTitle')}</h1>
                                <p className="text-sm" style={{ color: subtitleColor }}>
                                    {ui('createAccountSubtitle', { clientName: details.clientName })}
                                </p>
                            </div>

                            {(regEmailOtpEnabled || regSmsOtpEnabled) && (
                                <div className="mb-6">
                                    {regEmailOtpEnabled && regSmsOtpEnabled ? (
                                        <>
                                            <p className="text-xs text-center mb-3" style={{ color: subtitleColor }}>
                                                {ui('otpDeliveryPreference')}
                                            </p>
                                            <div
                                                className="flex rounded-xl border overflow-hidden"
                                                style={{ backgroundColor: 'var(--zkey-input-bg)', borderColor: 'var(--zkey-input-border)' }}
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => setOtpMethod('email')}
                                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold transition-colors"
                                                    style={
                                                        otpMethod === 'email'
                                                            ? { backgroundColor: 'var(--brand-primary-light)', color: 'var(--brand-primary)' }
                                                            : { color: subtitleColor }
                                                    }
                                                >
                                                    <Mail className="w-4 h-4" />
                                                    <span>{ui('authEmailTitle')}</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setOtpMethod('phone')}
                                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold transition-colors"
                                                    style={
                                                        otpMethod === 'phone'
                                                            ? { backgroundColor: 'var(--brand-primary-light)', color: 'var(--brand-primary)' }
                                                            : { color: subtitleColor }
                                                    }
                                                >
                                                    <Phone className="w-4 h-4" />
                                                    <span>{ui('authSmsTitle')}</span>
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div
                                            className="text-xs text-center rounded-xl border px-4 py-3"
                                            style={{ backgroundColor: 'var(--zkey-input-bg)', borderColor: 'var(--zkey-input-border)', color: subtitleColor }}
                                        >
                                            {ui('otpDeliverySingle', {
                                                channel: regSmsOtpEnabled ? ui('authSmsTitle') : ui('authEmailTitle'),
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            <form onSubmit={handleRegister} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-slate" />
                                        <input
                                            type="text"
                                            value={regFirstName}
                                            onChange={(e) => setRegFirstName(e.target.value)}
                                            placeholder={ui('firstNamePlaceholder')}
                                            required
                                            aria-invalid={!!error}
                                            className={inputClassName}
                                        />
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={regLastName}
                                            onChange={(e) => setRegLastName(e.target.value)}
                                            placeholder={ui('lastNamePlaceholder')}
                                            aria-invalid={!!error}
                                            className={inputClassNamePlain}
                                        />
                                    </div>
                                </div>

                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-slate" />
                                    <input
                                        type="email"
                                        value={regEmail}
                                        onChange={(e) => setRegEmail(e.target.value)}
                                        placeholder={ui('emailPlaceholder')}
                                        required
                                        aria-invalid={!!error}
                                        className={inputClassName}
                                    />
                                </div>

                                <div className="flex gap-2">
                                    <CountryCodeSelect
                                        value={regCountryCode}
                                        onChange={(code) => {
                                            setRegCountryCodeTouched(true);
                                            setRegCountryCode(code);
                                        }}
                                    />
                                    <div className="relative flex-1">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-slate" />
                                        <input
                                            type="tel"
                                            value={regPhone}
                                            onChange={(e) => setRegPhone(e.target.value)}
                                            placeholder={ui('phonePlaceholder')}
                                            required
                                            aria-invalid={!!error}
                                            className={inputClassNamePhone}
                                        />
                                    </div>
                                </div>

                                {regWalletAddress && (
                                    <div className="space-y-2">
                                        <label className="block text-xs font-semibold" style={{ color: subtitleColor }}>
                                            Wallet Address
                                        </label>
                                        <div
                                            className="rounded-xl border px-4 py-3 font-mono text-xs break-all select-text"
                                            style={{
                                                color: messageStyles?.successTextColor || feedbackDefaults.success.textColor,
                                                backgroundColor: messageStyles?.successBackgroundColor || feedbackDefaults.success.backgroundColor,
                                                borderColor: messageStyles?.successBorderColor || feedbackDefaults.success.borderColor,
                                            }}
                                        >
                                            {regWalletAddress}
                                        </div>
                                    </div>
                                )}

                                {success && <FeedbackMessage kind="success" text={success} />}
                                {error && <FeedbackMessage kind="error" text={error} />}

                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full h-14 font-bold rounded-xl zkey-primary-btn"
                                >
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin zkey-spinner--on-primary" /> : (localizedOverride(primaryButtonLabels.createAccount, 'createAccount') || ui('createAccount'))}
                                </Button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setStep('choose');
                                        setError('');
                                        setSuccess('');
                                    }}
                                    className="w-full text-sm transition-colors py-2 zkey-secondary-link"
                                >
                                    {ui('alreadyHaveAccount')}
                                </button>

                                <p className="text-center text-xs opacity-70" style={{ color: colors.footer || undefined }}>
                                    {footerText}
                                </p>
                            </form>
                        </motion.div>
                    )}

                    {/* Step 2: Input identifier (OTP) */}
                    {step === 'input' && (method === 'phone' || method === 'email') && (
                        <motion.div
                            key="input"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className={containerClassName}
                            style={loginContainerStyle}
                        >
                            <div className="text-center mb-8">
                                {details.logo && (
                                    <div className="mb-6 flex justify-center">
                                        <img
                                            src={details.logo.startsWith('http') || details.logo.startsWith('data:') ? details.logo : `https://avatar.vercel.sh/${details.logo}.svg`}
                                            alt={details.clientName}
                                            className={`w-auto object-contain ${invertLogo ? 'invert' : ''}`}
                                            style={{ height: logoHeight(48) }}
                                        />
                                    </div>
                                )}
                                <h1 className="text-2xl font-bold mb-2" style={{ color: titleColor }}>{ui('signInTitle')}</h1>
                                <p className="text-sm" style={{ color: subtitleColor }}>
                                    {ui('enterYourForClient', {
                                        method: method === 'phone' ? ui('methodPhone') : ui('methodEmail'),
                                        clientName: details.clientName,
                                    })}
                                </p>
                            </div>

                            <form onSubmit={handleRequestOtp} className="space-y-4">
                                <AnimatePresence mode="wait">
                                    {isNotFound ? (
                                        <motion.div
                                            key="not-found"
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="p-6 rounded-2xl border text-center space-y-4"
                                            style={{
                                                backgroundColor: messageStyles?.infoBackgroundColor || 'var(--brand-primary-light)',
                                                borderColor: messageStyles?.infoBorderColor || 'rgba(212, 175, 55, 0.30)',
                                            }}
                                        >
                                            <div className="w-12 h-12 bg-brand-gold/20 rounded-full flex items-center justify-center mx-auto">
                                                <User className="w-6 h-6 text-brand-gold" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-brand-gold">
                                                    {msg('accountNotFoundTitle', { clientName: details.clientName })}
                                                </h3>
                                                <p className="text-sm mt-1" style={{ color: messageStyles?.infoTextColor || subtitleColor }}>
                                                    {msg('accountNotFoundBody', { identifier })}
                                                </p>
                                            </div>
                                            <div className="pt-2">
                                                <Button
                                                    type="button"
                                                    onClick={() => {
                                                        if (method === 'email') {
                                                            setRegEmail(identifier);
                                                        } else {
                                                            setRegCountryCode(countryCode);
                                                            setRegPhone(identifier);
                                                        }
                                                        setStep('register');
                                                        setIsNotFound(false);
                                                    }}
                                                    className="w-full h-12 font-bold rounded-xl zkey-primary-btn"
                                                >
                                                    {localizedOverride(primaryButtonLabels.createAccountNow, 'createAccountNow') || ui('createAccountNow')}
                                                </Button>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsNotFound(false)}
                                                    className="mt-3 text-xs text-brand-slate hover:text-white transition-colors"
                                                >
                                                    {method === 'email' ? ui('tryDifferentEmail') : ui('tryDifferentNumber')}
                                                </button>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="input-fields"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="space-y-4"
                                        >
                                            {method === 'phone' ? (
                                                <div className="flex gap-2">
                                                    <CountryCodeSelect value={countryCode} onChange={setCountryCode} />
                                                    <div className="relative flex-1">
                                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-slate" />
                                                        <input
                                                            type="tel"
                                                            value={identifier}
                                                            onChange={(e) => setIdentifier(e.target.value)}
                                                            placeholder={ui('phonePlaceholder')}
                                                            required
                                                            aria-invalid={!!error}
                                                            className={inputClassNamePhone}
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="relative">
                                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-slate" />
                                                    <input
                                                        type="email"
                                                        value={identifier}
                                                        onChange={(e) => setIdentifier(e.target.value)}
                                                        placeholder={ui('emailPlaceholder')}
                                                        required
                                                        aria-invalid={!!error}
                                                        className={inputClassName}
                                                    />
                                                </div>
                                            )}

                                            {success && <FeedbackMessage kind="success" text={success} />}
                                            {error && <FeedbackMessage kind="error" text={error} />}

                                            <Button
                                                type="submit"
                                                disabled={isLoading}
                                                className="w-full h-14 font-bold rounded-xl zkey-primary-btn"
                                            >
                                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin zkey-spinner--on-primary" /> : (localizedOverride(primaryButtonLabels.sendCode, 'sendCode') || ui('sendCode'))}
                                            </Button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {!isNotFound && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setStep('choose');
                                            setMethod(null);
                                            setError('');
                                            setSuccess('');
                                        }}
                                        className="w-full text-sm transition-colors py-2 zkey-secondary-link"
                                    >
                                        {ui('backToOptions')}
                                    </button>
                                )}

                                <p className="text-center text-xs opacity-70" style={{ color: colors.footer || undefined }}>
                                    {footerText}
                                </p>
                            </form>
                        </motion.div>
                    )}

                    {/* Step 2: Wallet Login */}
                    {step === 'input' && method === 'wallet' && (
                        <motion.div
                            key="wallet"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className={containerClassName}
                            style={loginContainerStyle}
                        >
                            <div className="text-center mb-8">
                                {details.logo && (
                                    <div className="mb-6 flex justify-center">
                                        <img
                                            src={details.logo.startsWith('http') || details.logo.startsWith('data:') ? details.logo : `https://avatar.vercel.sh/${details.logo}.svg`}
                                            alt={details.clientName}
                                            className={`w-auto object-contain ${invertLogo ? 'invert' : ''}`}
                                            style={{ height: logoHeight(48) }}
                                        />
                                    </div>
                                )}
                                <h1 className="text-2xl font-bold mb-2" style={{ color: titleColor }}>{ui('stellarWalletTitle')}</h1>
                                <p className="text-sm" style={{ color: subtitleColor }}>
                                    {ui('stellarWalletSubtitle', { clientName: details.clientName })}
                                </p>
                            </div>

                            <div className="space-y-4">
                                <WalletLogin
                                    onWalletLogin={handleWalletLogin}
                                    buttonLabel={ui('loginWithWallet')}
                                    missingExtensionMessage={msg('walletMissingExtension')}
                                    couldNotGetAddressMessage={msg('walletCouldNotGetAddress')}
                                    failedToGetNonceMessage={msg('walletFailedToGetNonce')}
                                    walletSigningFailedMessage={msg('walletSigningFailed')}
                                    failedToLoginMessage={msg('walletFailedToLogin')}
                                    onError={(m) => {
                                        setSuccess('');
                                        setError(m);
                                    }}
                                />

                                {success && <FeedbackMessage kind="success" text={success} />}
                                {error && <FeedbackMessage kind="error" text={error} />}
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    setStep('choose');
                                    setMethod(null);
                                    setError('');
                                    setSuccess('');
                                }}
                                className="w-full text-sm transition-colors py-2 mt-4 zkey-secondary-link"
                            >
                                {ui('backToOptions')}
                            </button>

                            <p className="text-center text-xs opacity-70" style={{ color: colors.footer || undefined }}>
                                {footerText}
                            </p>
                        </motion.div>
                    )}

                    {/* Step 3: OTP Verification */}
                    {step === 'verify' && (
                        <motion.div
                            key="verify"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className={containerClassName}
                            style={loginContainerStyle}
                        >
                            <div className="text-center mb-8">
                                <div className="w-14 h-14 bg-brand-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <ShieldCheck className="w-7 h-7 text-brand-gold" />
                                </div>
                                <h1 className="text-2xl font-bold mb-2" style={{ color: titleColor }}>{ui('enterCodeTitle')}</h1>
                                <p className="text-sm" style={{ color: subtitleColor }}>
                                    {ui('codeSentTo', {
                                        identifier: method === 'email' ? identifier : `${countryCode} ${identifier}`,
                                    })}
                                </p>
                                <div className="mt-2 text-xs font-mono text-brand-gold">
                                    {timer > 0 ? (
                                        <p>{ui('codeExpiresIn', { time: formatTime(timer) })}</p>
                                    ) : (
                                        <p className="text-red-400">{ui('codeExpired')}</p>
                                    )}
                                </div>
                            </div>

                            <form onSubmit={handleVerifyOtp} className="space-y-6">
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                        setOtp(val);
                                        if (val.length === 6) {
                                            handleVerifyOtp(e, val);
                                        }
                                    }}
                                    placeholder={ui('otpPlaceholder')}
                                    maxLength={6}
                                    required
                                    aria-invalid={!!error}
                                    className={otpClassName}
                                />

                                {success && <FeedbackMessage kind="success" text={success} />}
                                {error && <FeedbackMessage kind="error" text={error} />}

                                <Button
                                    type="submit"
                                    disabled={isLoading || otp.length !== 6 || timer === 0}
                                    className="w-full h-14 font-bold rounded-xl zkey-primary-btn"
                                >
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin zkey-spinner--on-primary" /> : (localizedOverride(primaryButtonLabels.verifyAndSignIn, 'verifyAndSignIn') || ui('verifyAndSignIn'))}
                                </Button>

                                <div className="text-center space-y-2">
                                    {canResend && (
                                        <button
                                            type="button"
                                            onClick={handleRequestOtp}
                                            disabled={isLoading}
                                            className="text-sm text-brand-gold hover:underline font-bold"
                                        >
                                            {ui('resend')}
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setStep('input');
                                            setError('');
                                            setSuccess('');
                                        }}
                                        className="block w-full text-brand-slate hover:text-white text-sm transition-colors py-2"
                                    >
                                        {method === 'email' ? ui('changeEmail') : ui('changeNumber')}
                                    </button>
                                </div>

                                <p className="text-center text-xs opacity-70" style={{ color: colors.footer || undefined }}>
                                    {footerText}
                                </p>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            )}
        </div>
    );
}

export function LoginForm({
    previewDetails,
    previewMessages,
    interactionId,
    initialDetails,
    initialCountryCode,
}: {
    previewDetails?: InteractionDetails;
    previewMessages?: { success?: string; error?: string; info?: string };
    interactionId?: string;
    initialDetails?: InteractionDetails;
    initialCountryCode?: string;
}) {
    return (
        <LoginContent
            previewDetails={previewDetails}
            previewMessages={previewMessages}
            interactionId={interactionId}
            initialDetails={initialDetails}
            initialCountryCode={initialCountryCode}
        />
    );
}
