"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface HourRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  participation: {
    event_id: string;
    event_name: string;
    event_date: string;
    declared_hours: number;
    hours_attended: number;
    participation_status: string;
  } | null;
  onSuccess?: () => void;
}

export function HourRequestModal({
  isOpen,
  onClose,
  participation,
  onSuccess,
}: HourRequestModalProps) {
  const { currentUser } = useAuth();
  const [requestedHours, setRequestedHours] = useState(0);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (participation) {
      setRequestedHours(participation.hours_attended || participation.declared_hours || 0);
      setNotes("");
      setError(null);
      setSuccess(false);
    }
  }, [participation]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.volunteer_id || !participation) return;

    if (requestedHours <= 0) {
      setError("Please enter valid hours");
      return;
    }

    if (requestedHours > (participation.declared_hours || 24)) {
      setError(`Hours cannot exceed ${participation.declared_hours || 24} (event declared hours)`);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Update the participation record with the requested hours and notes
      const { error: updateError } = await supabase
        .from("event_participation")
        .update({
          hours_attended: requestedHours,
          declared_hours: requestedHours,
          notes: notes || null,
          approval_status: "pending",
        })
        .eq("event_id", participation.event_id)
        .eq("volunteer_id", currentUser.volunteer_id);

      if (updateError) throw updateError;

      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error("Error submitting hour request:", err);
      setError(err.message || "Failed to submit hour request");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !participation) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 p-6 rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-100">Request Hour Review</h2>
            <p className="text-sm text-gray-400 mt-1">Submit hours for approval</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white text-2xl leading-none p-1"
          >
            &times;
          </button>
        </div>

        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-check text-3xl text-green-400"></i>
            </div>
            <h3 className="text-lg font-medium text-gray-100 mb-2">Request Submitted!</h3>
            <p className="text-sm text-gray-400">
              Your hour review request has been submitted for approval.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Event Info */}
            <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-gray-100 mb-2">{participation.event_name}</h3>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span>
                  <i className="fas fa-calendar mr-1"></i>
                  {new Date(participation.event_date).toLocaleDateString()}
                </span>
                <span>
                  <i className="fas fa-clock mr-1"></i>
                  Max {participation.declared_hours}h
                </span>
              </div>
            </div>

            {/* Hours Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Hours Attended
              </label>
              <input
                type="number"
                min="0"
                max={participation.declared_hours || 24}
                step="0.5"
                value={requestedHours}
                onChange={(e) => setRequestedHours(parseFloat(e.target.value) || 0)}
                className="input-dark w-full rounded-lg py-2 px-3"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the number of hours you attended this event (max: {participation.declared_hours || 24}h)
              </p>
            </div>

            {/* Notes */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="input-dark w-full rounded-lg py-2 px-3"
                placeholder="Add any relevant details about your participation..."
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 button-glass-secondary py-2 rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 button-glass-primary py-2 rounded-lg text-sm disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Submitting...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane mr-2"></i>
                    Submit Request
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
