# Office Update Flow Test

## Step 1: Check Current Data

### Get all offices:
```bash
curl -X GET http://localhost:3000/api/test-office/offices
```

### Get all users with office data:
```bash
curl -X GET http://localhost:3000/api/test-office/users-with-office
```

### Get specific user (replace 1 with actual user ID):
```bash
curl -X GET http://localhost:3000/api/test-office/user/1
```

## Step 2: Test Database Update

### Update user office (replace IDs with actual values):
```bash
curl -X POST http://localhost:3000/api/test-office/update-user-office \
  -H "Content-Type: application/json" \
  -d '{"userId": "1", "officeId": "1"}'
```

## Step 3: Verify Update

### Check user data after update:
```bash
curl -X GET http://localhost:3000/api/test-office/user/1
```

## Step 4: Test Frontend API

### Get employees via frontend API:
```bash
curl -X GET http://localhost:3000/api/employees
```

### Update employee via frontend API:
```bash
curl -X PUT http://localhost:3000/api/employees/1 \
  -H "Content-Type: application/json" \
  -d '{"officeId": 1}'
```

## Expected Results:
1. Database should show updated officeId
2. Frontend API should return updated data
3. Frontend should display correct office name