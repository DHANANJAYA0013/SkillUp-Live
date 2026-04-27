import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Clock, Users } from "lucide-react";
import { API_BASE } from "@/features/authsystem/config";

interface Participant {
  userId?: string;
  name: string;
  joinedAt?: string;
}

interface SessionAttendance {
  _id: string;
  sessionId: string;
  roomId: string;
  date: string;
  mentorId: string;
  mentorName?: string;
  sessionTitle?: string;
  waitingUsers: Participant[];
  faceDetectedUsers: Participant[];
  faceNotDetectedUsers: Participant[];
  records?: Array<{
    userId?: string;
    name: string;
    status: "present" | "absent" | "waiting";
    time?: string;
    faceDetected: boolean;
  }>;
}

interface SessionAttendanceViewProps {
  sessionId: string;
  mentorId: string;
}

export const SessionAttendanceView: React.FC<SessionAttendanceViewProps> = ({
  sessionId,
  mentorId,
}) => {
  const [attendance, setAttendance] = useState<SessionAttendance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`${API_BASE}/attendance/session/${sessionId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch attendance: ${res.statusText}`);
        }

        const data = await res.json();
        console.log("[SessionAttendanceView] Fetched attendance:", data);

        if (data.data) {
          setAttendance(data.data);
        } else if (data.error) {
          setError(data.error);
        }
      } catch (err) {
        console.error("[SessionAttendanceView] Error fetching attendance:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch attendance");
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      void fetchAttendance();
    }
  }, [sessionId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Session Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-gray-500">Loading attendance data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Session Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3 rounded-lg bg-red-50 p-4">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="text-sm text-red-800">{error}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!attendance) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Session Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-gray-500">No attendance data available</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalParticipants = attendance.faceDetectedUsers.length + attendance.faceNotDetectedUsers.length;
  const presentCount = attendance.faceDetectedUsers.length;
  const absentCount = attendance.faceNotDetectedUsers.length;
  const waitingCount = attendance.waitingUsers.length;

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return "—";
    return timeStr;
  };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Session Attendance Summary</CardTitle>
          <CardDescription>
            {attendance.sessionTitle || "Live Session"} • {formatDate(attendance.date)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-lg bg-blue-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Total</span>
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div className="mt-2 text-2xl font-bold text-blue-600">{totalParticipants}</div>
              <p className="text-xs text-gray-500 mt-1">participant{totalParticipants !== 1 ? "s" : ""}</p>
            </div>

            <div className="rounded-lg bg-green-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Present</span>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
              <div className="mt-2 text-2xl font-bold text-green-600">{presentCount}</div>
              <p className="text-xs text-gray-500 mt-1">
                {totalParticipants > 0 ? `${Math.round((presentCount / totalParticipants) * 100)}%` : "—"}
              </p>
            </div>

            <div className="rounded-lg bg-red-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Absent</span>
                <AlertCircle className="h-4 w-4 text-red-600" />
              </div>
              <div className="mt-2 text-2xl font-bold text-red-600">{absentCount}</div>
              <p className="text-xs text-gray-500 mt-1">
                {totalParticipants > 0 ? `${Math.round((absentCount / totalParticipants) * 100)}%` : "—"}
              </p>
            </div>

            <div className="rounded-lg bg-yellow-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Waiting</span>
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
              <div className="mt-2 text-2xl font-bold text-yellow-600">{waitingCount}</div>
              <p className="text-xs text-gray-500 mt-1">pending detection</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Face Detected Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Face Detected Users</span>
            <Badge variant="default" className="bg-green-600">
              {presentCount}
            </Badge>
          </CardTitle>
          <CardDescription>Users successfully detected via face recognition</CardDescription>
        </CardHeader>
        <CardContent>
          {attendance.faceDetectedUsers.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-500">
              No users detected yet
            </div>
          ) : (
            <div className="space-y-2">
              {attendance.faceDetectedUsers.map((user, idx) => (
                <div
                  key={`detected-${user.userId || user.name}-${idx}`}
                  className="flex items-center justify-between rounded-lg bg-green-50 p-3"
                >
                  <div>
                    <div className="font-medium text-gray-900">{user.name}</div>
                    {user.joinedAt && (
                      <div className="text-xs text-gray-500">
                        Joined: {new Date(user.joinedAt).toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Face Not Detected Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Face Not Detected Users</span>
            <Badge variant="destructive" className="bg-red-600">
              {absentCount}
            </Badge>
          </CardTitle>
          <CardDescription>Users who joined but were not detected via face recognition</CardDescription>
        </CardHeader>
        <CardContent>
          {attendance.faceNotDetectedUsers.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-500">
              All present users were detected
            </div>
          ) : (
            <div className="space-y-2">
              {attendance.faceNotDetectedUsers.map((user, idx) => (
                <div
                  key={`not-detected-${user.userId || user.name}-${idx}`}
                  className="flex items-center justify-between rounded-lg bg-red-50 p-3"
                >
                  <div>
                    <div className="font-medium text-gray-900">{user.name}</div>
                    {user.joinedAt && (
                      <div className="text-xs text-gray-500">
                        Joined: {new Date(user.joinedAt).toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Waiting Users */}
      {attendance.waitingUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Waiting for Detection</span>
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                {waitingCount}
              </Badge>
            </CardTitle>
            <CardDescription>Users currently in the room awaiting face detection</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {attendance.waitingUsers.map((user, idx) => (
                <div
                  key={`waiting-${user.userId || user.name}-${idx}`}
                  className="flex items-center justify-between rounded-lg bg-yellow-50 p-3"
                >
                  <div>
                    <div className="font-medium text-gray-900">{user.name}</div>
                    {user.joinedAt && (
                      <div className="text-xs text-gray-500">
                        Joined: {new Date(user.joinedAt).toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                  <Clock className="h-5 w-5 text-yellow-600 animate-pulse" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attendance Records */}
      {attendance.records && attendance.records.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detailed Attendance Records</CardTitle>
            <CardDescription>Complete attendance log with timestamps</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-2 px-3 font-medium text-gray-600">Name</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600">Status</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600">Detection</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.records.map((record, idx) => (
                    <tr key={`record-${record.userId || record.name}-${idx}`} className="border-b">
                      <td className="py-2 px-3">{record.name}</td>
                      <td className="py-2 px-3">
                        <Badge
                          variant={
                            record.status === "present"
                              ? "default"
                              : record.status === "absent"
                                ? "destructive"
                                : "secondary"
                          }
                          className={
                            record.status === "present"
                              ? "bg-green-600"
                              : record.status === "absent"
                                ? "bg-red-600"
                                : ""
                          }
                        >
                          {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="py-2 px-3">
                        {record.faceDetected ? (
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="h-4 w-4" />
                            Detected
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-600">
                            <AlertCircle className="h-4 w-4" />
                            Not Detected
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-gray-500">{formatTime(record.time)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SessionAttendanceView;
