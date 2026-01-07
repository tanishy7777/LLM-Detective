import type { ProjectRow } from "../Components/Dashboard";
import type { ProjectModel } from "../Store/Projects";

export const ProjectStoreToRow = (project: Array<ProjectModel>): Array<ProjectRow> => {
    return project.map((item) => ({
        id: item.id,
        title: item.name,
        lastScanDate: item.lastScanDate,
        status: item.status as "Completed" | "Scanning" | "Failed",
    }));
};