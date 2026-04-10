from datetime import datetime, timedelta, timezone

# Indian Standard Time offset
IST_OFFSET = timedelta(hours=5, minutes=30)
IST_TZ = timezone(IST_OFFSET, 'IST')

def get_ist_now():
    """
    Returns a naive datetime object representing the current IST time. 
    This natively forces all MongoEngine Datetime fields, Django views, 
    and date calculations to intrinsically use IST regardless of the server AWS/OS clock.
    """
    # Get current time in IST timezone, then strip the timezone info 
    # to maintain naive-datetime compatibility for legacy comparisons/Mongo.
    return datetime.now(IST_TZ).replace(tzinfo=None)
