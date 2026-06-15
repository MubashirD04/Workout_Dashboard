import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

const ClaimInvite: React.FC = () => {
    const { code } = useParams<{ code: string }>();
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);

    const preview = useQuery((api as any).inviteCodes.previewInviteCode, { code: code || "" });
    const claim = useMutation((api as any).inviteCodes.claimInviteCode);

    const handleClaim = async () => {
        if (!code) return;
        try {
            await claim({ code });
            navigate('/');
        } catch (err: any) {
            setError(err.message);
        }
    };

    if (preview === undefined) return <div className="text-white">Validating invite...</div>;

    return (
        <div className="max-w-md mx-auto pt-12">
            <Card className="p-8 space-y-6">
                <h2 className="text-2xl font-bold text-white text-center">Join Your Trainer</h2>
                
                {preview.valid ? (
                    <div className="space-y-6 text-center">
                        <p className="text-slate-300">
                            You've been invited to join <span className="text-primary font-bold">{preview.trainerName}</span>'s team!
                        </p>
                        <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                            <p className="text-3xl font-mono font-bold text-primary">{code}</p>
                        </div>
                        <Button className="w-full" onClick={handleClaim}>Accept Invite</Button>
                    </div>
                ) : (
                    <div className="space-y-4 text-center">
                        <p className="text-red-400 font-medium">Invalid or Expired Invite</p>
                        <p className="text-slate-400 text-sm">{preview.reason}</p>
                        <Button className="w-full" variant="secondary" onClick={() => navigate('/')}>Return to Dashboard</Button>
                    </div>
                )}

                {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            </Card>
        </div>
    );
};

export default ClaimInvite;
