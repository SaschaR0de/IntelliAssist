import { motion } from "framer-motion";
import { Bot, Sparkles, Zap, Brain } from "lucide-react";
import { useDemoSettings } from "@/hooks/use-demo-settings";

interface LoadingMascotProps {
  size?: "sm" | "md" | "lg";
  message?: string;
  showSparkles?: boolean;
}

export default function LoadingMascot({ 
  size = "md", 
  message = "Processing...", 
  showSparkles = true 
}: LoadingMascotProps) {
  const { settings } = useDemoSettings();

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16"
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base"
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-3">
      <div className="relative">
        {/* Main mascot bot */}
        <motion.div
          className={`${sizeClasses[size]} rounded-lg flex items-center justify-center relative overflow-hidden`}
          style={{ backgroundColor: settings.primaryColor }}
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <motion.div
            animate={{
              rotate: 360
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            <Bot className="w-3/4 h-3/4 text-white" />
          </motion.div>
        </motion.div>

        {/* Sparkles around the mascot */}
        {showSparkles && (
          <>
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                style={{
                  top: `${20 + i * 15}%`,
                  left: `${20 + i * 20}%`,
                  color: settings.accentColor
                }}
                animate={{
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: "easeInOut"
                }}
              >
                <Sparkles className="w-3 h-3" />
              </motion.div>
            ))}
          </>
        )}

        {/* Processing indicator */}
        <motion.div
          className="absolute -top-1 -right-1"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: settings.accentColor }}
          />
        </motion.div>
      </div>

      {/* Loading message */}
      <motion.div
        className="text-center space-y-1"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <p className={`${textSizes[size]} font-medium text-gray-700`}>
          {message}
        </p>
        
        {/* Animated dots */}
        <div className="flex justify-center space-x-1">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="w-1 h-1 rounded-full bg-gray-400"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// Different mascot variations for different contexts
export function ThinkingMascot({ size = "md", message = "Thinking..." }: LoadingMascotProps) {
  const { settings } = useDemoSettings();

  return (
    <div className="flex flex-col items-center justify-center space-y-3">
      <motion.div
        className={`${size === "sm" ? "w-8 h-8" : size === "lg" ? "w-16 h-16" : "w-12 h-12"} rounded-lg flex items-center justify-center relative`}
        style={{ backgroundColor: settings.primaryColor }}
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <motion.div
          animate={{
            rotate: [0, 10, -10, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Brain className="w-3/4 h-3/4 text-white" />
        </motion.div>
      </motion.div>
      
      <motion.p
        className={`${size === "sm" ? "text-xs" : size === "lg" ? "text-base" : "text-sm"} font-medium text-gray-700`}
        animate={{
          opacity: [0.7, 1, 0.7]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        {message}
      </motion.p>
    </div>
  );
}

export function ProcessingMascot({ size = "md", message = "Processing..." }: LoadingMascotProps) {
  const { settings } = useDemoSettings();

  return (
    <div className="flex flex-col items-center justify-center space-y-3">
      <motion.div
        className={`${size === "sm" ? "w-8 h-8" : size === "lg" ? "w-16 h-16" : "w-12 h-12"} rounded-lg flex items-center justify-center relative`}
        style={{ backgroundColor: settings.primaryColor }}
        animate={{
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <motion.div
          animate={{
            rotate: 360
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          <Zap className="w-3/4 h-3/4 text-white" />
        </motion.div>
      </motion.div>
      
      <motion.p
        className={`${size === "sm" ? "text-xs" : size === "lg" ? "text-base" : "text-sm"} font-medium text-gray-700`}
        animate={{
          opacity: [0.7, 1, 0.7]
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        {message}
      </motion.p>
    </div>
  );
}