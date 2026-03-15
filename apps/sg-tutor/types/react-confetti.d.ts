// Purpose: Sprint 121 — Type declaration for react-confetti (no built-in types).
declare module "react-confetti" {
    import { ComponentType } from "react";
    interface ConfettiProps {
        width?: number;
        height?: number;
        numberOfPieces?: number;
        recycle?: boolean;
        run?: boolean;
        wind?: number;
        gravity?: number;
        colors?: string[];
        opacity?: number;
        tweenDuration?: number;
        style?: React.CSSProperties;
    }
    const Confetti: ComponentType<ConfettiProps>;
    export default Confetti;
}
