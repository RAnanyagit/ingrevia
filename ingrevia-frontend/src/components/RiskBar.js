import { motion } from "framer-motion";

const RiskBar = ({ risk }) => {
  const getRiskValue = (r) => {
    switch (r?.toLowerCase()) {
      case 'low': return 25;
      case 'moderate':
      case 'medium': return 60;
      case 'high':
      case 'critical': return 95;
      default: return 0;
    }
  };

  const getRiskColor = (r) => {
    switch (r?.toLowerCase()) {
      case 'low': return "bg-emerald-500";
      case 'moderate':
      case 'medium': return "bg-amber-500";
      case 'high':
      case 'critical': return "bg-red-500";
      default: return "bg-gray-300";
    }
  };

  const value = getRiskValue(risk);
  const color = getRiskColor(risk);

  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-1.5">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Analysis Risk Score</p>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${color} text-white`}>
          {risk || 'Unknown'}
        </span>
      </div>

      <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
    </div>
  );
};

export default RiskBar;
