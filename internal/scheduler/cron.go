package scheduler

import (
	"fmt"
	"time"
)

func (s *Scheduler) nextRun(cronExpr, timezone string) (time.Time, error) {
	loc, err := time.LoadLocation(timezone)
	if err != nil {
		loc = time.UTC
	}

	sched, err := s.parser.Parse(cronExpr)
	if err != nil {
		return time.Time{}, fmt.Errorf("invalid cron expression %q: %w", cronExpr, err)
	}

	return sched.Next(time.Now().In(loc)), nil
}