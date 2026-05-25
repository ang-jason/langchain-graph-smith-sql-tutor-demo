-- Departments
CREATE TABLE IF NOT EXISTS departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    location TEXT NOT NULL,
    budget REAL NOT NULL
);

-- Employees
CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    department_id INTEGER NOT NULL,
    hire_date TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- Salaries
CREATE TABLE IF NOT EXISTS salaries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    effective_date TEXT NOT NULL,
    FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- Projects
CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    department_id INTEGER NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT,
    status TEXT CHECK(status IN ('active','completed','paused')) NOT NULL DEFAULT 'active',
    FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- Project Assignments
CREATE TABLE IF NOT EXISTS project_assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    project_id INTEGER NOT NULL,
    role TEXT NOT NULL,
    assigned_date TEXT NOT NULL,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_emp_dept ON employees(department_id);
CREATE INDEX IF NOT EXISTS idx_emp_active ON employees(is_active);
CREATE INDEX IF NOT EXISTS idx_sal_emp ON salaries(employee_id);
CREATE INDEX IF NOT EXISTS idx_sal_date ON salaries(effective_date);
CREATE INDEX IF NOT EXISTS idx_pa_emp ON project_assignments(employee_id);
CREATE INDEX IF NOT EXISTS idx_pa_proj ON project_assignments(project_id);

-- Departments
INSERT INTO departments (name, location, budget) VALUES
    ('Engineering', 'San Francisco', 2500000),
    ('HR', 'New York', 800000),
    ('Sales', 'Chicago', 1500000),
    ('Finance', 'New York', 1200000),
    ('Operations', 'Austin', 900000);

-- Employees
INSERT INTO employees (name, email, department_id, hire_date, is_active) VALUES
    ('Alice Chen',    'alice@corp.com',   1, '2019-03-15', 1),
    ('Bob Martinez',  'bob@corp.com',     1, '2020-07-01', 1),
    ('Carol White',   'carol@corp.com',   1, '2021-01-10', 1),
    ('David Kim',     'david@corp.com',   1, '2018-11-20', 1),
    ('Eva Singh',     'eva@corp.com',     1, '2022-04-05', 1),
    ('Frank Liu',     'frank@corp.com',   1, '2023-02-14', 1),
    ('Grace Park',    'grace@corp.com',   2, '2019-06-01', 1),
    ('Henry Brown',   'henry@corp.com',   2, '2020-09-15', 1),
    ('Iris Johnson',  'iris@corp.com',    2, '2021-03-22', 1),
    ('Jack Wilson',   'jack@corp.com',    2, '2022-08-10', 0),
    ('Karen Davis',   'karen@corp.com',   3, '2018-05-30', 1),
    ('Leo Garcia',    'leo@corp.com',     3, '2019-10-12', 1),
    ('Mia Thompson',  'mia@corp.com',     3, '2020-12-01', 1),
    ('Nate Robinson', 'nate@corp.com',    3, '2021-07-19', 1),
    ('Olivia Scott',  'olivia@corp.com',  3, '2022-03-08', 1),
    ('Paul Adams',    'paul@corp.com',    3, '2023-01-25', 1),
    ('Quinn Baker',   'quinn@corp.com',   4, '2019-02-14', 1),
    ('Rachel Carter', 'rachel@corp.com',  4, '2020-05-20', 1),
    ('Sam Evans',     'sam@corp.com',     4, '2021-09-03', 1),
    ('Tina Foster',   'tina@corp.com',    4, '2022-11-15', 1),
    ('Uma Green',     'uma@corp.com',     4, '2023-04-01', 1),
    ('Victor Hall',   'victor@corp.com',  5, '2018-08-22', 1),
    ('Wendy Irving',  'wendy@corp.com',   5, '2019-12-05', 1),
    ('Xander Jones',  'xander@corp.com',  5, '2020-06-18', 1),
    ('Yara King',     'yara@corp.com',    5, '2021-10-27', 1),
    ('Zoe Lewis',     'zoe@corp.com',     5, '2022-07-14', 1),
    ('Aaron Moore',   'aaron@corp.com',   1, '2020-03-11', 1),
    ('Beth Nelson',   'beth@corp.com',    2, '2021-05-29', 1),
    ('Chris Owen',    'chris@corp.com',   3, '2022-09-16', 0),
    ('Diana Price',   'diana@corp.com',   4, '2023-02-28', 1);

-- Salaries (2 per employee: historical + current)
INSERT INTO salaries (employee_id, amount, effective_date) VALUES
    (1,105000,'2024-01-01'),(1,95000,'2022-01-01'),
    (2,96000,'2024-01-01'),(2,88000,'2022-01-01'),
    (3,101000,'2024-01-01'),(3,92000,'2022-01-01'),
    (4,135000,'2024-01-01'),(4,120000,'2022-01-01'),
    (5,85000,'2024-01-01'),(5,78000,'2022-01-01'),
    (6,78000,'2024-01-01'),(6,72000,'2023-03-01'),
    (7,74000,'2024-01-01'),(7,68000,'2022-01-01'),
    (8,71000,'2024-01-01'),(8,65000,'2022-01-01'),
    (9,76000,'2024-01-01'),(9,70000,'2022-01-01'),
    (10,60000,'2023-01-01'),(10,60000,'2022-01-01'),
    (11,122000,'2024-01-01'),(11,110000,'2022-01-01'),
    (12,108000,'2024-01-01'),(12,98000,'2022-01-01'),
    (13,93000,'2024-01-01'),(13,85000,'2022-01-01'),
    (14,88000,'2024-01-01'),(14,80000,'2022-01-01'),
    (15,82000,'2024-01-01'),(15,75000,'2022-01-01'),
    (16,74000,'2024-01-01'),(16,68000,'2023-02-01'),
    (17,115000,'2024-01-01'),(17,105000,'2022-01-01'),
    (18,104000,'2024-01-01'),(18,95000,'2022-01-01'),
    (19,96000,'2024-01-01'),(19,88000,'2022-01-01'),
    (20,90000,'2024-01-01'),(20,82000,'2022-01-01'),
    (21,82000,'2024-01-01'),(21,76000,'2023-05-01'),
    (22,79000,'2024-01-01'),(22,72000,'2022-01-01'),
    (23,74000,'2024-01-01'),(23,68000,'2022-01-01'),
    (24,71000,'2024-01-01'),(24,65000,'2022-01-01'),
    (25,77000,'2024-01-01'),(25,70000,'2022-01-01'),
    (26,72000,'2024-01-01'),(26,66000,'2022-07-01'),
    (27,98000,'2024-01-01'),(27,90000,'2022-01-01'),
    (28,69000,'2024-01-01'),(28,63000,'2022-01-01'),
    (29,78000,'2023-01-01'),(29,78000,'2022-09-01'),
    (30,86000,'2024-01-01'),(30,80000,'2023-03-01');

-- Projects
INSERT INTO projects (name, department_id, start_date, end_date, status) VALUES
    ('Platform Rewrite',        1, '2023-01-01', NULL,         'active'),
    ('ML Pipeline',             1, '2023-06-01', NULL,         'active'),
    ('Legacy Migration',        1, '2022-01-01', '2023-12-31', 'completed'),
    ('Talent System Upgrade',   2, '2023-03-01', NULL,         'active'),
    ('Onboarding Automation',   2, '2022-06-01', '2023-06-30', 'completed'),
    ('CRM Integration',         3, '2023-02-01', NULL,         'active'),
    ('Q4 Campaign',             3, '2023-09-01', '2023-12-31', 'completed'),
    ('Budget Forecasting Tool', 4, '2023-04-01', NULL,         'active'),
    ('Audit Automation',        4, '2022-09-01', '2023-09-30', 'completed'),
    ('Supply Chain Dashboard',  5, '2023-05-01', NULL,         'active');

-- Project Assignments
INSERT INTO project_assignments (employee_id, project_id, role, assigned_date) VALUES
    (1,1,'Tech Lead','2023-01-01'),(2,1,'Backend Dev','2023-01-01'),
    (3,1,'Frontend Dev','2023-02-01'),(27,1,'DevOps','2023-03-01'),
    (4,2,'ML Lead','2023-06-01'),(5,2,'Data Engineer','2023-06-01'),
    (6,2,'ML Engineer','2023-07-01'),(1,3,'Architect','2022-01-01'),
    (2,3,'Developer','2022-01-01'),(7,4,'HR Lead','2023-03-01'),
    (8,4,'HR Analyst','2023-03-01'),(28,4,'Coordinator','2023-04-01'),
    (9,5,'Project Lead','2022-06-01'),(11,6,'Sales Lead','2023-02-01'),
    (12,6,'Sales Rep','2023-02-01'),(13,6,'Sales Rep','2023-03-01'),
    (14,7,'Campaign Lead','2023-09-01'),(15,7,'Analyst','2023-09-01'),
    (17,8,'Finance Lead','2023-04-01'),(18,8,'Analyst','2023-04-01'),
    (30,8,'Junior Analyst','2023-05-01'),(19,9,'Audit Lead','2022-09-01'),
    (20,9,'Analyst','2022-09-01'),(22,10,'Ops Lead','2023-05-01'),
    (23,10,'Ops Analyst','2023-05-01'),(24,10,'Coordinator','2023-06-01'),
    (25,10,'Analyst','2023-06-01');
