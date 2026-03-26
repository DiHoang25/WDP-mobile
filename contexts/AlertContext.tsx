import CustomAlert, { AlertType } from "@/components/common/CustomAlert";
import React, { createContext, useCallback, useContext, useState } from "react";

interface AlertButton {
    text: string;
    onPress?: () => void;
    style?: "default" | "cancel" | "destructive";
}

interface AlertState {
    visible: boolean;
    title: string;
    message: string;
    type: AlertType;
    buttons?: AlertButton[];
}

interface AlertContextType {
    showAlert: (
        title: string,
        message: string,
        typeOrButtons?: AlertType | AlertButton[],
        buttons?: AlertButton[]
    ) => void;
}

const AlertContext = createContext<AlertContextType>({
    showAlert: () => { },
});

// Auto-detect alert type from title keywords
function detectType(title: string, explicitType?: AlertType): AlertType {
    if (explicitType) return explicitType;
    const t = title.toLowerCase();
    if (t.includes("lỗi") || t.includes("error") || t.includes("thất bại")) return "error";
    if (t.includes("thành công") || t.includes("success") || t.includes("hoàn tất")) return "success";
    if (t.includes("cảnh báo") || t.includes("warning") || t.includes("xác nhận") || t.includes("confirm")) return "warning";
    return "info";
}

export function AlertProvider({ children }: { children: React.ReactNode }) {
    const [alert, setAlert] = useState<AlertState>({
        visible: false,
        title: "",
        message: "",
        type: "info",
    });

    const showAlert = useCallback(
        (
            title: string,
            message: string,
            typeOrButtons?: AlertType | AlertButton[],
            buttons?: AlertButton[]
        ) => {
            let alertType: AlertType | undefined;
            let alertButtons: AlertButton[] | undefined;

            if (Array.isArray(typeOrButtons)) {
                alertButtons = typeOrButtons;
            } else {
                alertType = typeOrButtons;
                alertButtons = buttons;
            }

            setAlert({
                visible: true,
                title,
                message,
                type: detectType(title, alertType),
                buttons: alertButtons,
            });
        },
        []
    );

    const handleClose = useCallback(() => {
        setAlert((prev) => ({ ...prev, visible: false }));
    }, []);

    return (
        <AlertContext.Provider value={{ showAlert }}>
            {children}
            <CustomAlert
                visible={alert.visible}
                title={alert.title}
                message={alert.message}
                type={alert.type}
                buttons={alert.buttons}
                onClose={handleClose}
            />
        </AlertContext.Provider>
    );
}

export const useAlert = () => useContext(AlertContext);
