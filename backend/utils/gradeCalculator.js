/**
 * Grade Calculator Utility
 * Centralizes the scoring logic for the entire educational portal.
 */

const calculateGradeAndGPA = (score) => {
    let grade = 'F';
    let gpa = 0.0;
    let remarks = 'Fail';

    if (score >= 80) {
        grade = 'A+';
        gpa = 5.0;
        remarks = 'Outstanding';
    } else if (score >= 70) {
        grade = 'A';
        gpa = 4.0;
        remarks = 'Excellent';
    } else if (score >= 60) {
        grade = 'A-';
        gpa = 3.5;
        remarks = 'Very Good';
    } else if (score >= 50) {
        grade = 'B';
        gpa = 3.0;
        remarks = 'Good';
    } else if (score >= 40) {
        grade = 'C';
        gpa = 2.0;
        remarks = 'Pass';
    } else if (score >= 33) {
        grade = 'D';
        gpa = 1.0;
        remarks = 'Pass';
    }

    return { grade, gpa, remarks };
};

const calculateOverallStatus = (marks) => {
    const hasFailed = marks.some(m => m.score < 33);
    const totalScore = marks.reduce((acc, m) => acc + m.score, 0);
    const avgGPA = hasFailed ? 0 : (marks.reduce((acc, m) => acc + calculateGradeAndGPA(m.score).gpa, 0) / marks.length);
    
    return {
        hasFailed,
        totalScore,
        avgGPA: parseFloat(avgGPA.toFixed(2)),
        finalGrade: hasFailed ? 'F' : calculateFinalGrade(avgGPA)
    };
};

const calculateFinalGrade = (gpa) => {
    if (gpa >= 5.0) return 'A+';
    if (gpa >= 4.0) return 'A';
    if (gpa >= 3.5) return 'A-';
    if (gpa >= 3.0) return 'B';
    if (gpa >= 2.0) return 'C';
    if (gpa >= 1.0) return 'D';
    return 'F';
};

module.exports = {
    calculateGradeAndGPA,
    calculateOverallStatus,
    calculateFinalGrade
};
