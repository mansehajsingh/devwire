import React from "react";
import { IoMdHand } from "react-icons/io";
import { FlairChip } from "../FlairMenu";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./styles.module.scss";

const priorityToIcon = {
    low: "❤️‍🩹",
    medium: "💘",
    high: "💔",
    critical: "❤️‍🔥"
}

export const IssueRow = ({ issue }) => {

    const { project_id } = useParams();
    const navigate = useNavigate();

    const renderFlairs = () => {
        return issue.flairs.map((flair) => {
            return (
                <FlairChip 
                    value={flair}
                    fontSize={"10px"}
                    styles={{marginRight: "5px", marginTop: "2px"}}
                />
            );
        });
    }

    const goToIssue = () => {
        navigate(`/projects/${project_id}/issues/${issue.id}`);
    }

    return (
        <div className={styles.issue_row} onClick={goToIssue}>
            <div className={styles.large_section}>
                {issue.open ? (
                    <IoMdHand className={styles.open_icon}/>
                ) : (
                    <IoMdHand className={styles.closed_icon} />
                )}
                <p 
                    className={styles.issue_title}
                    style={{ color: issue.open ? "#FFF" : "#505050" }}
                >
                    {issue.title}
                </p>
            </div>
            <div className={styles.under_row}>
                <p className={styles.priority_tag}>Priority: {priorityToIcon[issue.priority]}</p>
                <div className={styles.flair_container}>
                    <p className={styles.flairs_tag}>Flairs: </p>
                    {renderFlairs()}
                </div>
            </div>
        </div>
    );
}

export default IssueRow;