// components/BaseButton.tsx
"use client";

import { Button, ButtonProps } from "antd";
import { ReactNode } from "react";

interface IBaseButton extends ButtonProps {
  children: ReactNode;
  isSubmit?: boolean;
}

const BaseButton = ({
  children,
  isSubmit = false,
  ...props
}: IBaseButton) => {
  return (
    <Button
      htmlType={isSubmit ? "submit" : "button"}
      size="large"
      className="font-bold px-6 h-12 transition-all"
      {...props} // Cho phép override mọi props của AntD Button
    >
      {children}
    </Button>
  );
};

export default BaseButton;