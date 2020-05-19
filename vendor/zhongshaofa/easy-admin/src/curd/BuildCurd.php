<?php


namespace EasyAdmin\curd;

use EasyAdmin\curd\exceptions\TableException;
use EasyAdmin\tool\CommonTool;
use think\facade\Db;

/**
 * 快速构建系统CURD
 * Class BuildCurd
 * @package EasyAdmin\curd
 */
class BuildCurd
{

    /**
     * 当前目录
     * @var string
     */
    protected $dir;

    /**
     * 应用目录
     * @var string
     */
    protected $rootDir;

    /**
     * 分隔符
     * @var string
     */
    protected $DS = DS;

    /**
     *  表前缀
     * @var string
     */
    protected $tablePrefix = 'ea';

    /**
     * 主表
     * @var string
     */
    protected $table;

    /**
     * 主表列信息
     * @var array
     */
    protected $tableColumns;

    /**
     * 数据列表可见字段
     * @var string
     */
    protected $fields;

    /**
     * 是否删除模式
     * @var bool
     */
    protected $delete = false;

    /**
     * 是否强制覆盖
     * @var bool
     */
    protected $force = false;

    /**
     * 关联模型
     * @var array
     */
    protected $relationArray = [];

    /**
     * 生成的控制器名
     * @var string
     */
    protected $controllerFilename;

    /**
     * 生成的模型文件名
     * @var string
     */
    protected $modelFilename;

    /**
     * 复选框字段
     * @var array
     */
    protected $checkboxFields;

    /**
     * 单选框字段
     * @var array
     */
    protected $radioFields;

    /**
     * 图片字段
     * @var array
     */
    protected $imageFields;

    /**
     * 文件字段
     * @var array
     */
    protected $fileFields;

    /**
     * 时间字段
     * @var array
     */
    protected $dateFields;

    /**
     * 开关组件字段
     * @var array
     */
    protected $switchFields;

    /**
     * 下拉选择字段
     * @var array
     */
    protected $selectFileds;

    /**
     * 富文本字段
     * @var array
     */
    protected $editorFields;

    /**
     * 排序字段
     * @var array
     */
    protected $sortFields;

    /**
     * 忽略字段
     * @var array
     */
    protected $ignorefields;

    /**
     * 相关生成文件
     * @var array
     */
    protected $fileList;

    public function __construct()
    {
        $this->tablePrefix = config('database.connections.mysql.prefix');
        $this->dir = __DIR__;
        $this->rootDir = root_path();
        return $this;
    }

    public function setTable($table)
    {
        $this->table = $table;
        try {
            $colums = Db::query("SHOW FULL COLUMNS FROM {$this->tablePrefix}{$this->table}");
            foreach ($colums as $vo) {
                $colum = [
                    'type'    => $vo['Type'],
                    'comment' => $vo['Comment'],
                    'default' => $vo['Default'],
                ];
                $this->tableColumns[$vo['Field']] = $colum;
            }
        } catch (\Exception $e) {
            throw new TableException($e->getMessage());
        }

        // 初始化默认控制器名
        $nodeArray = explode('_', $this->table);
        if (count($nodeArray) == 1) {
            $this->controllerFilename = ucfirst($nodeArray[0]);
        } else {
            foreach ($nodeArray as $k => $v) {
                if ($k == 0) {
                    $this->controllerFilename = "{$v}/";
                } else {
                    $this->controllerFilename .= ucfirst($v);
                }
            }
        }

        // 初始化默认模型名
        $this->modelFilename = ucfirst(CommonTool::lineToHump($this->table));

        return $this;
    }

    public function setRelation($relationTable, $foreignKey, $primaryKey = null, $modelFilename = null)
    {
        if (!isset($this->tableColumns[$foreignKey])) {
            throw new TableException("主表不存在外键字段：{$foreignKey}");
        }
        try {
            $colums = Db::query("SHOW FULL COLUMNS FROM {$this->tablePrefix}{$relationTable}");
            $formatColums = [];
            foreach ($colums as $vo) {
                if (empty($primaryKey) && $vo['Key'] == 'PRI') {
                    $primaryKey = $vo['Field'];
                }
                $colum = [
                    'type'    => $vo['Type'],
                    'comment' => $vo['Comment'],
                    'default' => $vo['Default'],
                ];
                $formatColums[$vo['Field']] = $colum;
            }
            $relation = [
                'modelFilename' => empty($modelFilename) ? ucfirst(CommonTool::lineToHump($relationTable)) : $modelFilename,
                'foreignKey'    => $foreignKey,
                'primaryKey'    => $primaryKey,
                'tableColumns'  => $formatColums,
            ];
            $this->relationArray[$relationTable] = $relation;
        } catch (\Exception $e) {
            throw new TableException($e->getMessage());
        }
        return $this;
    }

    public function setControllerFilename($controllerFilename)
    {
        $this->controllerFilename = $controllerFilename;
        return $this;
    }

    public function setFields($fields)
    {
        $this->fields = $fields;
        return $this;
    }

    public function setDelete($delete)
    {
        $this->delete = $delete;
        return $this;
    }

    public function setForce($force)
    {
        $this->force = $force;
        return $this;
    }


    public function render()
    {
        // 控制器
        $controllerFile = "{$this->rootDir}admin{$this->DS}controller{$this->DS}{$this->controllerFilename}.php";
        if (empty($this->relationArray)) {
            $controllerIndexMethod = '';
        } else {
            $controllerIndexMethod = '';
        }
        $controllerValue = CommonTool::replaceTemplate(
            $this->getTemplate("controller{$this->DS}controller"),
            [
                'controllerNamespace'  => "app/admin/controller/{$this->controllerFilename}",
                'controllerAnnotation' => "获取表注释",
                'modelFilename'        => "app/admin/model/{$this->modelFilename}",
                'indexMethod'          => $controllerIndexMethod,
            ]);
        $this->fileList[$controllerFile] = $controllerValue;

        // 模型

        // 视图

        // JS

        return $this;
    }

    protected function check()
    {
        return $this;
    }

    public function create()
    {
        $this->check();
        return true;
    }

    public function delete()
    {
        return true;
    }

    protected function getTemplate($name)
    {
        return file_get_contents("{$this->dir}{$this->DS}templates{$this->DS}{$name}.code");
    }

}