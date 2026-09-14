import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useCurrentUser } from '../hooks/useCurrentUser';
import AthleteProfileOnboarding from '../pages/Onboarding/AthleteProfileOnboarding';

interface AthleteProfileGateProps {
    children: React.ReactNode;
}

// Blocks the dashboard behind a one-time athlete-profile setup step for any
// signed-in user who doesn't have one yet (new signups, and any pre-existing
// account created before this feature shipped).
export const AthleteProfileGate: React.FC<AthleteProfileGateProps> = ({ children }) => {
    const { user, isLoading: userLoading } = useCurrentUser();

    // Wait for the Convex user row to exist (UserSync's upsert) before querying
    // athleteProfile — getAuthenticatedUser throws if the user row isn't there yet.
    const profile = useQuery(
        api.athleteProfile.getMyAthleteProfile,
        user ? {} : 'skip'
    );

    const stillResolving = userLoading || (!!user && profile === undefined);

    if (stillResolving) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary/60" />
            </div>
        );
    }

    if (user && profile === null) {
        return <AthleteProfileOnboarding />;
    }

    return <>{children}</>;
};

export default AthleteProfileGate;
