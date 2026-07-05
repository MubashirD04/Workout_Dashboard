import React from 'react';
import { useParams } from 'react-router-dom';
import type { Id } from "../../../../convex/_generated/dataModel";
import WorkoutLog from '../WorkoutLog';
import CardioTracker from '../CardioTracker';
import BodyMetrics from '../BodyMetrics';
import NutritionTracker from '../NutritionTracker';

const ClientDetail: React.FC = () => {
    const { clientId } = useParams<{ clientId: string }>();

    if (!clientId) return null;

    return (
        <div className="space-y-8">
            <header>
                <h2 className="text-3xl font-bold text-white">Client Progress</h2>
                <p className="text-slate-400">Monitoring data for client ID: {clientId}</p>
            </header>

            <div className="space-y-12">
                <section>
                    <h3 className="text-2xl font-bold text-white mb-4">Workouts</h3>
                    <WorkoutLog targetUserId={clientId as Id<"users">} />
                </section>

                <section>
                    <h3 className="text-2xl font-bold text-white mb-4">Cardio</h3>
                    <CardioTracker targetUserId={clientId as Id<"users">} />
                </section>

                <section>
                    <h3 className="text-2xl font-bold text-white mb-4">Body Metrics</h3>
                    <BodyMetrics targetUserId={clientId as Id<"users">} />
                </section>

                <section>
                    <h3 className="text-2xl font-bold text-white mb-4">Nutrition</h3>
                    <NutritionTracker targetUserId={clientId as Id<"users">} />
                </section>

                {/* Progress Photos intentionally omitted: trainers are never
                    permitted to view client progress photos (see convex/lib/auth.ts,
                    convex/progressPhotos.ts). Rendering it here previously threw
                    "Forbidden: trainers cannot access client progress photos." */}
            </div>
        </div>
    );
};

export default ClientDetail;